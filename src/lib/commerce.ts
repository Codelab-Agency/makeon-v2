/**
 * Checkout and inventory lifecycle. Product prices use RON; orders and Stripe use
 * integer bani. Stock is physical inventory, reserved is held for pending payments,
 * and sellable inventory is stock - reserved. Inventory transitions are atomic.
 */
import "server-only";
import Stripe from "stripe";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import type { Order } from "@/payload-types";
import { getCMS } from "./cms";
import { checkoutConfigured, ordersConfigured } from "./commerce-env";
import { packageLabel } from "./product-format";
import {
  CommerceError,
  parseLines,
  priceBani,
  validGrind,
  type CheckoutLine,
} from "./commerce-validation";

import { parseCheckoutDetails, type CheckoutDetails } from "./checkout-details";
import { validateEasyboxDetails, deliveryPriceBani } from "./easybox";

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new CommerceError("Plata online nu este încă disponibilă.", 503);
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
}

/** Share Payload's transaction connection so raw SQL and Local API writes commit together. */
export function transactionDB(cms: Payload, id: number | string) {
  return (cms.db as unknown as PostgresAdapter).sessions[String(id)].db;
}

export async function transaction<T>(
  cms: Payload,
  operation: (id: number | string) => Promise<T>,
): Promise<T> {
  const id = await cms.db.beginTransaction();
  if (id == null) throw new Error("PostgreSQL transactions are required.");
  try {
    const value = await operation(id);
    await cms.db.commitTransaction(id);
    return value;
  } catch (error) {
    await cms.db.rollbackTransaction(id);
    throw error;
  }
}

// Serializes retries for the same order, including separate serverless instances.
export async function lockOrder(
  cms: Payload,
  id: number | string,
  reference: string,
) {
  await transactionDB(cms, id).execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${reference}))`,
  );
}

type CheckoutOrder = Order & { reservation?: true };

/** Earlier releases stored Stripe metadata in columns instead of the JSON snapshot. */
function reservationOrder(record: Record<string, unknown>): CheckoutOrder {
  const snapshot = record.snapshot as Order;
  const iso = (value: unknown) => value instanceof Date ? value.toISOString() : String(value);
  const expiresAt = snapshot.expiresAt ?? iso(record.expires_at);
  const createdAt = snapshot.createdAt ?? (record.created_at
    ? iso(record.created_at)
    : new Date(new Date(expiresAt).getTime() - 35 * 60000).toISOString());
  return {
    ...snapshot,
    id: snapshot.id ?? 0,
    orderType: snapshot.orderType ?? "stock",
    paymentMethod: snapshot.paymentMethod ?? "card",
    fulfillmentStatus: snapshot.fulfillmentStatus ?? "new",
    reference: String(record.reference),
    status: snapshot.status ?? (record.status as Order['status'] | undefined) ?? "pending",
    stripeSessionId: snapshot.stripeSessionId ?? (record.stripe_session_id as string | null | undefined),
    createdAt,
    updatedAt: snapshot.updatedAt ?? createdAt,
    expiresAt,
    reservation: true,
  };
}

/** Legacy pending orders remain recoverable; new card attempts live outside orders. */
async function findCheckout(cms: Payload, reference: string, id: number | string): Promise<CheckoutOrder | undefined> {
  const req = { transactionID: id };
  const existing = (await cms.find({
    collection: "orders",
    where: { reference: { equals: reference } },
    depth: 0,
    limit: 1,
    req,
  })).docs[0];
  if (existing) return existing;
  const db = transactionDB(cms, id);
  const result = await db.execute(sql`SELECT to_jsonb(r) AS record FROM checkout_reservations r WHERE reference = ${reference}`);
  const record = result.rows[0]?.record as Record<string, unknown> | undefined;
  return record ? reservationOrder(record) : undefined;
}

async function updateCheckout(cms: Payload, id: number | string, order: CheckoutOrder, data: Partial<Order>): Promise<CheckoutOrder> {
  if (!order.reservation) return cms.update({ collection: "orders", id: order.id, req: { transactionID: id }, data });
  const updated = { ...order, ...data, updatedAt: new Date().toISOString() };
  const { reservation: _, ...snapshot } = updated;
  await transactionDB(cms, id).execute(sql`UPDATE checkout_reservations SET snapshot = ${JSON.stringify(snapshot)}::jsonb, expires_at = ${updated.expiresAt}::timestamptz WHERE reference = ${order.reference}`);
  return updated;
}

async function hasOrderHistory(cms: Payload, id: number | string, orderID: number) {
  const result = await transactionDB(cms, id).execute(sql`SELECT
    (EXISTS (SELECT 1 FROM order_status_emails WHERE order_id = ${orderID})
      OR EXISTS (SELECT 1 FROM order_shipments WHERE order_id = ${orderID})) AS has_history`);
  return result.rows[0]?.has_history === true;
}

/** Preserve notification and shipment audit trails for legacy checkout drafts. */
async function finishAbandonedCheckout(cms: Payload, id: number | string, order: CheckoutOrder, status: "expired" | "failed") {
  const db = transactionDB(cms, id);
  if (order.reservation) {
    await db.execute(sql`DELETE FROM checkout_reservations WHERE reference = ${order.reference}`);
    return;
  }
  // FK inserts lock the parent row. Lock it first so history cannot appear
  // between our check and the delete in another transaction.
  await db.execute(sql`SELECT id FROM orders WHERE id = ${order.id} FOR UPDATE`);
  const req = { transactionID: id };
  if (await hasOrderHistory(cms, id, order.id))
    await cms.update({ collection: "orders", id: order.id, req, data: { status } });
  else await cms.delete({ collection: "orders", id: order.id, req });
}

/**
 * Reconcile a session fetched from Stripe or verified by its webhook.
 * Paid sessions deduct stock; expiration releases reservations. The order lock
 * and pending-state guard make retries harmless. Reject conflicting terminal
 * states and payment amounts that differ from the persisted order snapshot.
 */
export async function applySession(
  session: Stripe.Checkout.Session,
  cmsArg?: Payload,
) {
  const cms = cmsArg ?? (await getCMS());
  const reference = session.client_reference_id;
  if (!reference) throw new Error("Checkout session has no order reference.");
  const target =
    session.status === "complete" && session.payment_status === "paid"
      ? "paid"
      : session.status === "expired"
        ? "expired"
        : null;
  if (!target) return;
  return transaction(cms, async (id) => {
    const req = { transactionID: id };
    await lockOrder(cms, id, reference);
    const order = await findCheckout(cms, reference, id);
    // Expiration retries from an older production link may arrive after regeneration.
    if (
      order?.orderType === "production" &&
      order.stripeSessionId !== session.id &&
      target === "expired"
    )
      return;
    // Expiration webhooks can be retried after an abandoned draft was removed.
    if (!order && target === "expired") return;
    if (!order || order.stripeSessionId !== session.id)
      throw new Error("Unknown checkout session.");
    if (
      target === "paid" &&
      (session.currency !== order.currency ||
        session.amount_total !== order.totalBani)
    )
      throw new Error("Payment amount does not match the order snapshot.");
    if (order.status === target) return order;
    if (order.status !== "pending") throw new Error("Conflicting order state.");
    const db = transactionDB(cms, id);
    const quantities = new Map<number, number>();
    // Production orders represent goods made after payment, not existing inventory.
    // Never reserve or deduct physical stock for this explicitly separate flow.
    for (const line of order.orderType === "production" ? [] : order.items) {
      const productID =
        typeof line.product === "number" ? line.product : line.product.id;
      quantities.set(
        productID,
        (quantities.get(productID) ?? 0) + line.quantity,
      );
    }
    // Acquire product locks in ID order across flows to reduce deadlock risk.
    for (const [productID, quantity] of [...quantities].sort(
      (a, b) => a[0] - b[0],
    )) {
      // Row locks and a conditional update prevent overselling and duplicate stock deductions.
      const updated =
        await db.execute(sql`UPDATE products SET reserved = reserved - ${quantity},
        stock = stock - ${target === "paid" ? quantity : 0}
        WHERE id = ${productID} AND reserved >= ${quantity} AND stock >= ${quantity} RETURNING id`);
      if (!("rows" in updated) || updated.rows.length !== 1)
        throw new Error("Stock reservation is inconsistent.");
    }
    if (target === "expired" && order.orderType !== "production") {
      await finishAbandonedCheckout(cms, id, order, "expired");
      return;
    }
    const data: Partial<Order> = {
        status: target,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        customerEmail: order.checkoutDetails ? order.customerEmail : session.customer_details?.email || order.customerEmail,
        customerName: order.checkoutDetails ? order.customerName : session.customer_details?.name || order.customerName,
        customerPhone: order.checkoutDetails ? order.customerPhone : session.customer_details?.phone || order.customerPhone,
        shippingAddress: session.collected_information?.shipping_details
          ? { ...session.collected_information.shipping_details }
          : (order.shippingAddress ?? null),
    };
    if (order.reservation) {
      const { id: _, reservation: __, createdAt: ___, updatedAt: ____, ...snapshot } = order;
      const registered = await cms.create({ collection: "orders", req, data: { ...snapshot, ...data } });
      await db.execute(sql`DELETE FROM checkout_reservations WHERE reference = ${order.reference}`);
      return registered;
    }
    return updateCheckout(cms, id, order, data);
  });
}

/** Release a draft only when Stripe definitively rejected creating its session. */
async function failDraft(cms: Payload, reference: string) {
  await transaction(cms, async (id) => {
    const req = { transactionID: id };
    await lockOrder(cms, id, reference);
    const order = await findCheckout(cms, reference, id);
    if (!order || order.status !== "pending" || order.stripeSessionId) return;
    const quantities = new Map<number, number>();
    for (const line of order.orderType === "production" ? [] : order.items) {
      const productID =
        typeof line.product === "number" ? line.product : line.product.id;
      quantities.set(
        productID,
        (quantities.get(productID) ?? 0) + line.quantity,
      );
    }
    for (const [productID, quantity] of [...quantities].sort(
      (a, b) => a[0] - b[0],
    )) {
      const updated = await transactionDB(cms, id).execute(
        sql`UPDATE products SET reserved = reserved - ${quantity} WHERE id = ${productID} AND reserved >= ${quantity} RETURNING id`,
      );
      if (!("rows" in updated) || updated.rows.length !== 1)
        throw new Error("Stock reservation is inconsistent.");
    }
    if (order.orderType !== "production") {
      await finishAbandonedCheckout(cms, id, order, "failed");
    } else {
      await cms.update({ collection: "orders", id: order.id, req, data: { status: "failed" } });
    }
  });
}

/**
 * Recover up to 25 overdue pending orders per call, including missed webhooks.
 * A local timestamp alone never releases stock: Stripe is the authority.
 * Catalog/checkout requests invoke this recovery; it is not a scheduled job.
 */
/** Remove legacy abandoned stock drafts whose reservations have already been released. */
export async function pruneAbandonedCheckouts(cms: Payload) {
  const { docs } = await cms.find({ collection: "orders", depth: 0, limit: 25,
    where: { and: [
      { status: { in: ["expired", "failed"] } },
      { or: [{ orderType: { equals: "stock" } }, { orderType: { exists: false } }] },
      { or: [{ paymentMethod: { equals: "card" } }, { paymentMethod: { exists: false } }] },
    ] },
  });
  for (const draft of docs) await transaction(cms, async id => {
    const req = { transactionID: id };
    await lockOrder(cms, id, draft.reference);
    const current = (await cms.find({ collection: "orders", req, depth: 0, limit: 1, where: { id: { equals: draft.id } } })).docs[0];
    if (current && current.orderType !== "production" && current.paymentMethod !== "cod" && ["expired", "failed"].includes(current.status)) {
      await transactionDB(cms, id).execute(sql`SELECT id FROM orders WHERE id = ${current.id} FOR UPDATE`);
      if (!(await hasOrderHistory(cms, id, current.id)))
        await cms.delete({ collection: "orders", id: current.id, req });
    }
  });
}

export async function reconcileExpired(cms: Payload, stripe: Stripe) {
  await pruneAbandonedCheckouts(cms);
  const reservations = await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`SELECT to_jsonb(r) AS record FROM checkout_reservations r
    WHERE expires_at < now() AND coalesce(snapshot->>'status', to_jsonb(r)->>'status', 'pending') = 'pending'
    ORDER BY expires_at LIMIT 25`);
  const { docs } = await cms.find({
    collection: "orders",
    depth: 0,
    limit: 25,
    where: {
      and: [
        { status: { equals: "pending" } },
        { expiresAt: { less_than: new Date().toISOString() } },
      ],
    },
  });
  for (const order of [...docs, ...reservations.rows.map(row => reservationOrder(row.record as Record<string, unknown>))]) {
    if (order.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );
      if (session.status !== "open") await applySession(session, cms);
    } else {
      // Recover an interrupted session-create using the persisted idempotency key.
      await sessionForOrder(order, stripe, cms);
    }
  }
}

/**
 * Create/recover a session with the order reference as Stripe's retry key.
 * A network timeout may hide a successful request, so its reservation stays
 * retryable. The order lock covers both creation and persistence of the session ID.
 */
export async function sessionForOrder(
  order: CheckoutOrder,
  stripe: Stripe,
  cms: Payload,
) {
  try {
    return await transaction(cms, async (id) => {
      await lockOrder(cms, id, order.reference);
      // Re-read under the same lock used by payment/expiration handlers. Stripe
      // creation and recording its ID cannot race another retry or a webhook.
      const current = await findCheckout(cms, order.reference, id);
      if (!current) throw new CommerceError("Sesiunea de plată nu mai este disponibilă.", 409);
      order = current;
      if (order.status !== "pending" || order.paymentMethod === "cod")
        throw new CommerceError(
          "Sesiunea de plată nu mai este disponibilă.",
          409,
        );
      if (order.stripeSessionId)
        return stripe.checkout.sessions.retrieve(order.stripeSessionId);
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          allowed_payment_method_types: ["card"],
          client_reference_id: order.reference,
          metadata: { orderReference: order.reference },
          ...(order.customerEmail
            ? { customer_email: order.customerEmail }
            : {}),
          line_items: order.items.map((line) => ({
            quantity: line.quantity,
            price_data: {
              currency: "ron",
              unit_amount: line.unitPriceBani,
              product_data: { name: line.name, description: line.grind },
            },
          })),
          shipping_options: [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: order.shippingBani, currency: "ron" },
                display_name: (order.checkoutDetails as CheckoutDetails | null)?.shipping?.method==="easybox" ? "Livrare la easybox" : "Livrare în România",
              },
            },
          ],
          ...(!order.checkoutDetails ? { shipping_address_collection: { allowed_countries: ["RO"] as ["RO"] } } : {}),
          phone_number_collection: { enabled: true },
          success_url: `${process.env.APP_URL}/comanda?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL}/comanda?anulata=1${order.orderType === "production" ? "&la_cerere=1" : ""}`,
          expires_at:
            order.orderType === "production"
              ? Math.floor(new Date(order.expiresAt!).getTime() / 1000)
              : Math.floor(new Date(order.createdAt).getTime() / 1000) +
                35 * 60,
        },
        {
          idempotencyKey:
            order.orderType === "production"
              ? `${order.reference}:production:${order.paymentAttempt}`
              : order.reference,
        },
      );
      await updateCheckout(cms, id, order, {
          stripeSessionId: session.id,
          ...(order.orderType === "production"
            ? { paymentUrl: session.url }
            : {}),
          expiresAt: new Date(session.expires_at * 1000).toISOString(),
      });
      return session;
    });
  } catch (error) {
    // Definitive Stripe rejection: release stock. Network failures remain retryable.
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError &&
      error.code !== "idempotency_key_in_use"
    )
      await failDraft(cms, order.reference);
    throw error;
  }
}

/**
 * Reserve inventory and persist a technical snapshot before opening Stripe.
 * Card attempts create an order only in applySession after verified payment;
 * COD creates its order and deducts inventory immediately.
 * Client lines contain selections only; CMS supplies prices and availability.
 * Reusing a key requires the same pending cart. Different grind variants consume
 * the same product stock, so reservations aggregate their quantities.
 */
export async function createCheckout(
  lines: CheckoutLine[],
  key: string,
  stripe?: Stripe,
  cmsArg?: Payload,
  legalVersion?: string,
  details?: CheckoutDetails,
  deliveryFetcher?: typeof fetch,
) {
  const cms = cmsArg ?? (await getCMS());
  details = details ? parseCheckoutDetails(details) : undefined;
  if (details) details = await validateEasyboxDetails(details, deliveryFetcher);
  const cod = details?.paymentMethod === "cod";
  if (!(cod ? ordersConfigured() : checkoutConfigured()))
    throw new CommerceError("Metoda de plată nu este disponibilă momentan.", 503);
  if (!cod) stripe ??= stripeClient();
  // Keep validation here as well as at the HTTP boundary: every caller must
  // provide positive integer quantities before any reservation is attempted.
  lines = parseLines({ items: lines });
  if (stripe && !cod) await reconcileExpired(cms, stripe);
  const reference = `MK-${key}`;
  const fingerprint = (items: CheckoutLine[]) =>
    JSON.stringify(
      items
        .map(({ slug, grind, quantity }) => ({ slug, grind, quantity }))
        .sort((a, b) =>
          `${a.slug}:${a.grind}`.localeCompare(`${b.slug}:${b.grind}`),
        ),
    );
  const order = await transaction(cms, async (id) => {
    await lockOrder(cms, id, reference);
    const req = { transactionID: id };
    const doc = await findCheckout(cms, reference, id);
    if (doc) {
      if (
        fingerprint(doc.items) !== fingerprint(lines) ||
        doc.orderType === "production" ||
        (cod ? !["cod_pending", "paid"].includes(doc.status) : doc.status !== "pending") ||
        (doc.paymentMethod ?? "card") !== (cod ? "cod" : "card") ||
        JSON.stringify(doc.checkoutDetails ? parseCheckoutDetails(doc.checkoutDetails) : null) !== JSON.stringify(details ?? null)
      )
        throw new CommerceError("Coșul s-a modificat. Reîncearcă plata.", 409);
      if (legalVersion && doc.legalVersion && doc.legalVersion !== legalVersion)
        throw new CommerceError(
          "Termenii s-au actualizat. Reîncarcă pagina și începe o comandă nouă.",
          409,
        );
      if (legalVersion && !doc.legalVersion)
        return updateCheckout(cms, id, doc, {
            legalVersion,
            legalAcceptedAt: new Date().toISOString(),
        });
      return doc;
    }
    const products = await cms.find({
      collection: "products",
      where: { slug: { in: lines.map((l) => l.slug) } },
      limit: 100,
      depth: 0,
      req,
    });
    const bySlug = new Map(products.docs.map((p) => [p.slug, p]));
    const quantities = new Map<number, number>();
    const items = lines.map((line) => {
      const p = bySlug.get(line.slug);
      if (!p || !p.active)
        throw new CommerceError("Un produs nu mai este disponibil.", 409);
      if (!validGrind(p.category, line.grind, p.decaffFormat))
        throw new CommerceError("Formatul cafelei este invalid.");
      quantities.set(p.id, (quantities.get(p.id) ?? 0) + line.quantity);
      return {
        ...line,
        product: p.id,
        name: `${p.name} · ${packageLabel(p)}`,
        unitPriceBani: priceBani(p.price),
      };
    });
    for (const [productID, quantity] of [...quantities].sort(
      (a, b) => a[0] - b[0],
    )) {
      const updated = cod
        ? await transactionDB(cms, id).execute(sql`UPDATE products SET stock = stock - ${quantity}
          WHERE id = ${productID} AND active = true AND stock - reserved >= ${quantity} RETURNING id`)
        : await transactionDB(cms, id).execute(sql`UPDATE products SET reserved = reserved + ${quantity}
          WHERE id = ${productID} AND active = true AND stock - reserved >= ${quantity} RETURNING id`);
      if (!("rows" in updated) || updated.rows.length !== 1)
        throw new CommerceError(
          "Stoc insuficient pentru unul dintre produse. Actualizează coșul.",
          409,
        );
    }
    const shippingBani = deliveryPriceBani(details?.shipping.method);
    const totalBani = items.reduce(
      (sum, line) => sum + line.unitPriceBani * line.quantity,
      shippingBani,
    );
    if (!Number.isSafeInteger(totalBani) || totalBani > 99999999)
      throw new CommerceError("Valoare comandă invalidă.");
    const data = {
        reference,
        items,
        ...(legalVersion
          ? { legalVersion, legalAcceptedAt: new Date().toISOString() }
          : {}),
        totalBani,
        shippingBani,
        currency: "ron",
        orderType: "stock" as const,
        status: cod ? "cod_pending" as const : "pending" as const,
        paymentMethod: cod ? "cod" as const : "card" as const,
        ...(details ? {
          checkoutDetails: details,
          customerName: details.contact.name,
          customerEmail: details.contact.email,
          customerPhone: details.contact.phone,
          shippingAddress: { name: details.contact.name, phone: details.contact.phone, address: details.shipping },
        } : {}),
        fulfillmentStatus: "new" as const,
        expiresAt: cod ? null : new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    };
    if (cod) return cms.create({ collection: "orders", req, data });
    const now = new Date().toISOString();
    const snapshot: Order = { ...data, id: 0, createdAt: now, updatedAt: now };
    await transactionDB(cms, id).execute(sql`INSERT INTO checkout_reservations (reference, snapshot, expires_at) VALUES (${reference}, ${JSON.stringify(snapshot)}::jsonb, ${data.expiresAt}::timestamptz)`);
    return { ...snapshot, reservation: true as const };
  });
  if (cod) return { reference: order.reference, paymentMethod: "cod" as const };
  const session = order.stripeSessionId
    ? await stripe!.checkout.sessions.retrieve(order.stripeSessionId)
    : await sessionForOrder(order, stripe!, cms);
  if (!session.url || session.status !== "open") {
    await applySession(session, cms);
    throw new CommerceError("Sesiunea de plată nu mai este disponibilă.", 409);
  }
  return { url: session.url };
}

/** Expire an open Stripe session, then reconcile its actual state to handle payment races. */
export async function cancelCheckout(
  key: string,
  stripe = stripeClient(),
  cmsArg?: Payload,
) {
  const cms = cmsArg ?? (await getCMS());
  const reference = `MK-${key}`;
  const order = await transaction(cms, async id => {
    await lockOrder(cms, id, reference);
    return findCheckout(cms, reference, id);
  });
  if (!order || order.orderType === "production" || order.paymentMethod === "cod") return {};
  if (order.status === "paid" && order.stripeSessionId)
    return { url: `/comanda?session_id=${encodeURIComponent(order.stripeSessionId)}`, paid: true };
  if (order.status !== "pending") {
    await pruneAbandonedCheckouts(cms);
    return {};
  }
  // Recover a session-create response lost before its ID reached our database.
  let session = order.stripeSessionId
    ? await stripe.checkout.sessions.retrieve(order.stripeSessionId)
    : await sessionForOrder(order, stripe, cms);
  if (session.status === "open") {
    try { session = await stripe.checkout.sessions.expire(session.id); }
    catch (error) {
      // Payment may have completed between retrieve and expire. Re-read Stripe;
      // never delete a paid checkout or release its stock based on browser state.
      const latest = await stripe.checkout.sessions.retrieve(session.id);
      if (latest.status === "open") throw error;
      session = latest;
    }
  }
  const result = await applySession(session, cms);
  if (result?.status === "paid") return { url: `/comanda?session_id=${encodeURIComponent(session.id)}`, paid: true };
  if (session.status !== "expired") throw new CommerceError("Verificăm încă plata. Reîncearcă în câteva momente.", 409);
  return {};

}

export { parseLines, CommerceError };
