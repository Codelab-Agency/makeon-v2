import "server-only";
import { randomUUID } from "node:crypto";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import { after } from "next/server";
import { transaction, transactionDB } from "./commerce";

export const fulfillmentLabels = {
  new: "Nouă",
  processing: "În pregătire",
  shipped: "Expediată",
  delivered: "Livrată",
} as const;
type Fulfillment = keyof typeof fulfillmentLabels;
type EmailBody = { from?: string; to: string[]; subject: string; text: string; html: string };
const escape = (text: string) => text.replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

/** Snapshot the recipient and message; retries must use exactly the same Resend payload. */
export function statusEmailBody(reference: string, name: string, recipient: string, status: Fulfillment): EmailBody {
  const explanation = {
    new: "Comanda ta este înregistrată și așteaptă pregătirea.",
    processing: "Am început pregătirea comenzii tale.",
    shipped: "Comanda ta a fost expediată.",
    delivered: "Comanda ta este marcată ca livrată. Mulțumim că ai ales Makeon!",
  }[status];
  const greeting = name ? `Bună, ${name}!` : "Bună!";
  return {
    to: [recipient],
    subject: `Makeon · Comanda ${reference} · ${fulfillmentLabels[status]}`,
    text: `${greeting}\n\nComanda ${reference} are un status nou: ${fulfillmentLabels[status]}.\n${explanation}\n\nEchipa Makeon`,
    html: `<div style="font-family:Arial,sans-serif;background:#faf4ea;color:#3b2d25;padding:32px;max-width:600px;margin:auto"><p style="font-size:22px;font-weight:bold">makeon</p><h1 style="font-size:24px">${fulfillmentLabels[status]}</h1><p>${escape(greeting)}</p><p>Statusul comenzii <strong>${escape(reference)}</strong> a fost actualizat.</p><p>${explanation}</p><p style="margin-top:28px">Echipa Makeon</p></div>`,
  };
}

const db = (cms: Payload) => (cms.db as unknown as PostgresAdapter).drizzle;
const rows = (result: unknown) => (result as { rows: Record<string, unknown>[] }).rows;

/** The queue insert participates in the order transaction; rolled-back saves cannot send mail. */
export const queueOrderStatusEmail: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || req.user?.collection !== "users" ||
      !previousDoc || previousDoc.fulfillmentStatus === doc.fulfillmentStatus ||
      !Object.hasOwn(fulfillmentLabels, doc.fulfillmentStatus)) return doc;
  const transactionID = await req.transactionID;
  if (transactionID == null) throw new Error("Notificarea comenzii necesită o tranzacție.");
  const recipient = typeof doc.customerEmail === "string" ? doc.customerEmail.trim() : "";
  const valid = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(recipient);
  const body = statusEmailBody(doc.reference, doc.customerName || "", recipient, doc.fulfillmentStatus);
  await transactionDB(req.payload, transactionID).execute(sql`
    INSERT INTO order_status_emails (event_id, order_id, target_status, body, state, error)
    VALUES (${randomUUID()}, ${doc.id}, ${doc.fulfillmentStatus}, ${JSON.stringify(body)}::jsonb,
      ${valid ? "pending" : "skipped"}, ${valid ? null : "Comanda nu are o adresă de email validă."})`);
  scheduleOrderEmails(req, Number(doc.id));
  return doc;
};

export function scheduleOrderEmails(req: PayloadRequest, orderID: number) {
  // Next.after runs after Payload commits and the HTTP response is finished. Local
  // API scripts have no request lifecycle; they can drain the persisted queue explicitly.
  if (!req.context.skipStatusEmailDispatch) {
    try {
      after(async () => {
        try { await deliverOrderStatusEmails(req.payload, orderID); }
        catch { req.payload.logger.error("Order status email dispatch failed; notification remains in queue."); }
      });
    } catch {
      req.payload.logger.warn("Order status notification queued outside an HTTP request; dispatch explicitly.");
    }
  }
}

/** Atomic leases serialize workers across instances, while durable keys cover uncertain sends. */
async function claim(cms: Payload, orderID: number, audience: "customer" | "merchant") {
  return transaction(cms, async transactionID => {
    const connection = transactionDB(cms, transactionID);
    await connection.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${'status-email:' + orderID}))`);
    const [event] = rows(await connection.execute(sql`
      SELECT *, now() AS db_now FROM order_status_emails WHERE order_id = ${orderID}
      AND audience = ${audience} AND state NOT IN ('sent', 'skipped') ORDER BY id LIMIT 1 FOR UPDATE`));
    if (!event || event.state === "blocked") return null;
    const now = new Date(String(event.db_now)).getTime();
    if (event.state === "sending" && new Date(String(event.lease_until)).getTime() > now) return null;
    // Resend retains keys for 24h. Stop short of that boundary rather than risk a duplicate.
    if (event.first_attempt_at && now - new Date(String(event.first_attempt_at)).getTime() >= 23 * 3600000) {
      await connection.execute(sql`UPDATE order_status_emails SET state = 'blocked',
        error = 'Verifică trimiterea în Resend înainte de o nouă încercare; fereastra de protecție a expirat.' WHERE id = ${event.id}`);
      return null;
    }
    const body = event.body as EmailBody;
    if (audience === "merchant" && !body.to.length) {
      const recipient = (process.env.ORDER_NOTIFICATION_EMAIL_TO || process.env.CONTACT_EMAIL_TO || "").trim();
      if (recipient) body.to = [recipient];
    }
    if (!body.to.length || body.to.some(to => !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(to))) {
      await connection.execute(sql`UPDATE order_status_emails SET state = 'failed',
        error = 'Configurează o adresă validă pentru destinatarul notificării.' WHERE id = ${event.id}`);
      return null;
    }
    const from = body.from || process.env.RESEND_FROM_EMAIL;
    if (!process.env.RESEND_API_KEY || !from || /@resend\.dev\b/i.test(from)) {
      await connection.execute(sql`UPDATE order_status_emails SET state = 'failed',
        error = 'Configurează Resend și un expeditor de pe un domeniu verificat pentru notificări.' WHERE id = ${event.id}`);
      return null;
    }
    body.from = from;
    const token = randomUUID();
    await connection.execute(sql`UPDATE order_status_emails SET state = 'sending', error = NULL,
      body = ${JSON.stringify(body)}::jsonb, attempt_token = ${token},
      first_attempt_at = COALESCE(first_attempt_at, now()), lease_until = now() + interval '90 seconds'
      WHERE id = ${event.id}`);
    return { id: event.id, eventID: event.event_id, body, token };
  });
}

/** Runs only against committed events; no customer email is sent inside a database transaction. */
export async function deliverOrderStatusEmails(cms: Payload, orderID: number, fetcher: typeof fetch = fetch) {
  // A failed merchant delivery must not prevent customer status notifications (or vice versa).
  for (const audience of ["merchant", "customer"] as const) {
  for (let count = 0; count < 5; count++) {
    const event = await claim(cms, orderID, audience);
    if (!event) break;
    let providerID: string | null = null;
    try {
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `makeon-status/${event.eventID}` },
        body: JSON.stringify({ from: event.body.from, to: event.body.to, subject: event.body.subject, text: event.body.text, html: event.body.html }),
        signal: AbortSignal.timeout(8000),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && typeof result?.id === "string") providerID = result.id;
    } catch { /* Unknown acceptance is retried with the same payload/key, never a fresh key. */ }
    await db(cms).execute(sql`UPDATE order_status_emails SET state = ${providerID ? "sent" : "failed"},
      provider_id = ${providerID}, sent_at = ${providerID ? new Date().toISOString() : null}, lease_until = NULL,
      error = ${providerID ? null : "Trimiterea nu a fost confirmată. Verifică expeditorul Resend și reîncearcă."}
      WHERE id = ${event.id} AND attempt_token = ${event.token} AND state = 'sending'`);
    if (!providerID) break;
  }
  }
}

export async function orderStatusEmailHistory(cms: Payload, orderID: number) {
  return rows(await db(cms).execute(sql`SELECT id, target_status AS status, audience, state, error,
    sent_at AS "sentAt", created_at AS "createdAt", lease_until AS "leaseUntil"
    FROM order_status_emails WHERE order_id = ${orderID} ORDER BY id DESC LIMIT 10`));
}
