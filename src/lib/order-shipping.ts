import "server-only";
import { randomUUID } from "node:crypto";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import type { Order } from "@/payload-types";
import { transaction, transactionDB, lockOrder } from "./commerce";
import { shipmentPayment } from "./shipment-payment";
import { SamedayError, samedayConfig, samedayOptions, samedayCreate, samedayPDF, samedayLocker } from "./sameday-client";
import { parseEasyboxLocker, type EasyboxLocker } from "./easybox-selection";

export function orderEasybox(order: Order): EasyboxLocker | undefined {
  const details=order.checkoutDetails as {shipping?:{method?:string;locker?:unknown}}|null;
  if(details?.shipping?.method!=="easybox")return;
  try{return parseEasyboxLocker(details.shipping.locker);}
  catch{throw new SamedayError("Easyboxul din comandă nu este valid. Verifică datele înainte de emiterea AWB-ului.",409);}
}

const db = (cms: Payload) => (cms.db as unknown as PostgresAdapter).drizzle;
type ShipmentRow = { order_id: number; environment: string; account_hash: string; attempt_id: string; state: string; awb_number: string | null; attempted_at: string; error: string | null };
const rows = (result: unknown) => (result as { rows: ShipmentRow[] }).rows;

export async function shipmentFor(cms: Payload, orderID: number) {
  const [shipment] = rows(await db(cms).execute(sql`SELECT * FROM order_shipments WHERE order_id = ${orderID}`));
  if (!shipment) return null;
  const config = samedayConfig();
  if (shipment.environment !== config.environment || shipment.account_hash !== config.account)
    throw new SamedayError("AWB-ul aparține altei configurații Sameday. Restabilește contul și mediul inițial.", 409);
  return {
    state: shipment.state, number: shipment.awb_number, error: shipment.error,
    environment: shipment.environment,
    canAttach: shipment.state === "uncertain" || (shipment.state === "sending" && Date.now() - new Date(shipment.attempted_at).getTime() > 5 * 60000),
  };
}

export function shippingInput(value: unknown) {
  if (!value || typeof value !== "object") throw new SamedayError("Date AWB invalide.", 400);
  const body = value as Record<string, unknown>;
  const text = (key: string, max: number, min = 1) => {
    const v = typeof body[key] === "string" ? body[key].trim() : "";
    if (v.length < min || v.length > max || /[\x00-\x1f]/.test(v))
      throw new SamedayError("Completează corect datele destinatarului.", 400);
    return v;
  };
  const weight = body.weight;
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0.01 || weight > 31.5)
    throw new SamedayError("Greutatea unui colet trebuie să fie între 0,01 și 31,5 kg.", 400);
  if (!Number.isSafeInteger(body.pickupPoint) || Number(body.pickupPoint) <= 0 || !Number.isSafeInteger(body.service) || Number(body.service) <= 0)
    throw new SamedayError("Alege punctul de ridicare și serviciul.", 400);
  const phone = text("phone", 40, 7);
  if (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7)
    throw new SamedayError("Telefonul destinatarului nu este valid.", 400);
  return {
    weight, pickupPoint: Number(body.pickupPoint), service: Number(body.service),
    name: text("name", 100, 2), phone,
    county: text("county", 100), city: text("city", 100), address: text("address", 250, 5),
    postalCode: text("postalCode", 6, 0),
  };
}

export function shipmentBody(order: Order, input: ReturnType<typeof shippingInput>, verifiedLocker?: EasyboxLocker) {
  const payment = shipmentPayment(order);
  if (!payment.allowed) throw new SamedayError(payment.reason!, 409);
  const shipping = order.shippingAddress as { address?: { country?: string }; country?: string } | null;
  const country = shipping?.address?.country || shipping?.country;
  if (country !== "RO") throw new SamedayError("Această integrare acceptă doar livrări în România.", 400);
  if (input.postalCode && !/^\d{6}$/.test(input.postalCode)) throw new SamedayError("Codul poștal trebuie să conțină 6 cifre.", 400);
  const locker=orderEasybox(order);
  if(locker && verifiedLocker && locker.id!==verifiedLocker.id)throw new SamedayError("Easyboxul comenzii s-a modificat. Reîncarcă înainte de emitere.",409);
  const destination=verifiedLocker??locker;
  if(destination && payment.cashOnDeliveryBani>0 && destination.supportedPayment===false)throw new SamedayError("Easyboxul nu acceptă plata la ridicare.",409);
  return {
    pickupPoint: input.pickupPoint, packageType: 0, packageNumber: 1,
    packageWeight: input.weight, parcels: [{ weight: input.weight }],
    service: input.service, awbPayment: 1, cashOnDelivery: payment.cashOnDeliveryBani / 100, insuredValue: 0, thirdPartyPickup: 0,
    awbRecipient: {
      name: input.name, phoneNumber: input.phone, personType: 0,
      countyString: destination?.county??input.county, cityString: destination?.city??input.city, address: destination?.address??input.address,
      postalCode: (destination?.postalCode??input.postalCode) || undefined, email: order.customerEmail || undefined,
    },
    ...(destination?{lockerLastMile:destination.id}:{}),
    clientInternalReference: order.reference,
  };
}

/** Claim durably before the network call. Never retry an ambiguous provider acceptance. */
export async function createOrderShipment(cms: Payload, orderID: number, value: unknown, fetcher: typeof fetch = fetch) {
  const input = shippingInput(value);
  const config = samedayConfig();
  const options = await samedayOptions(fetcher);
  if (!options.pickupPoints.some(p => p.id === input.pickupPoint) || !options.services.some(s => s.id === input.service))
    throw new SamedayError("Punctul de ridicare sau serviciul nu aparține contului Sameday.", 400);
  const original=await cms.findByID({collection:"orders",id:orderID,depth:0});
  const selectedLocker=orderEasybox(original);
  if(selectedLocker && config.environment!=="production")throw new SamedayError("Easyboxul ales pe harta publică necesită configurația Sameday de producție.",409);
  const verifiedLocker=selectedLocker ? await samedayLocker(selectedLocker.id,fetcher):undefined;
  const attempt = randomUUID();
  const body = await transaction(cms, async id => {
    const order = await cms.findByID({ collection: "orders", id: orderID, depth: 0, req: { transactionID: id } });
    await lockOrder(cms, id, order.reference);
    const connection = transactionDB(cms, id);
    const [existing] = rows(await connection.execute(sql`SELECT * FROM order_shipments WHERE order_id = ${orderID} FOR UPDATE`));
    if (existing) {
      if (existing.environment !== config.environment || existing.account_hash !== config.account)
        throw new SamedayError("Comanda are deja o încercare AWB pe alt cont sau mediu Sameday.", 409);
      if (existing.state === "created") return null;
      if (existing.state !== "rejected")
        throw new SamedayError("Emiterea anterioară trebuie verificată în eAWB înainte de a continua.", 409);
    }
    // Reload after obtaining the checkout/admin order lock.
    const fresh = await cms.findByID({ collection: "orders", id: orderID, depth: 0, req: { transactionID: id } });
    const expected=orderEasybox(fresh)?"easybox":"address";
    if(options.services.find(service=>service.id===input.service)?.deliveryMethod!==expected)
      throw new SamedayError("Serviciul Sameday trebuie să corespundă livrării din comandă: adresă sau easybox.",400);
    const request = shipmentBody(fresh, input, verifiedLocker);
    await connection.execute(sql`INSERT INTO order_shipments
      (order_id, environment, account_hash, attempt_id, state, request)
      VALUES (${orderID}, ${config.environment}, ${config.account}, ${attempt}, 'sending', ${JSON.stringify(request)}::jsonb)
      ON CONFLICT (order_id) DO UPDATE SET attempt_id = EXCLUDED.attempt_id, state = 'sending',
        request = EXCLUDED.request, error = NULL, attempted_at = now()`);
    return request;
  });
  if (!body) return shipmentFor(cms, orderID);
  let number: string;
  try { number = await samedayCreate(body, fetcher); }
  catch (error) {
    // An unexpected exception may happen after dispatch. Only explicit safe failures are retryable.
    const uncertain = !(error instanceof SamedayError) || error.uncertain;
    const message = error instanceof SamedayError ? error.message : "Rezultatul emiterii este neconfirmat. Verifică în eAWB.";
    await db(cms).execute(sql`UPDATE order_shipments SET state = ${uncertain ? "uncertain" : "rejected"}, error = ${message}
      WHERE order_id = ${orderID} AND attempt_id = ${attempt} AND state = 'sending'`);
    throw new SamedayError(message, 502, uncertain);
  }
  // If persistence fails after Sameday succeeds, the durable 'sending' claim blocks duplicates.
  await db(cms).execute(sql`UPDATE order_shipments SET state = 'created', awb_number = ${number}, created_at = now(), error = NULL
    WHERE order_id = ${orderID} AND attempt_id = ${attempt} AND state = 'sending'`);
  return shipmentFor(cms, orderID);
}

/** Recover a confirmed eAWB number after a timeout; no new shipment is issued. */
export async function attachOrderShipment(cms: Payload, orderID: number, number: string) {
  const current = await shipmentFor(cms, orderID);
  if (!current?.canAttach) throw new SamedayError("Comanda nu are o emitere neconfirmată care poate fi reconciliată.", 409);
  await samedayPDF(number, "A4");
  await db(cms).execute(sql`UPDATE order_shipments SET state = 'created', awb_number = ${number}, created_at = now(), error = NULL
    WHERE order_id = ${orderID} AND (state = 'uncertain' OR (state = 'sending' AND attempted_at < now() - interval '5 minutes'))`);
  return shipmentFor(cms, orderID);
}
