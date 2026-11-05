import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { CollectionAfterChangeHook } from "payload";
import type { Order } from "@/payload-types";
import type { CheckoutDetails } from "./checkout-details";
import { transactionDB } from "./commerce";
import { scheduleOrderEmails } from "./order-status-email";

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
const money = (bani: number) => `${(bani / 100).toFixed(2)} RON`;

export function merchantOrderEmail(order: Order) {
  const details = order.checkoutDetails as CheckoutDetails | null;
  const shipping = details?.shipping;
  const production = order.orderType === "production";
  const rows: [string, string][] = [
    ["Comandă", order.reference],
    ["Tip", production ? "La cerere · de confirmat telefonic" : "Din stoc"],
    ["Client", order.customerName || "—"], ["Telefon", order.customerPhone || "—"],
    ["Email", order.customerEmail || "—"],
    ["Plată", production ? `${order.paymentMethod === "cod" ? "Ramburs" : "Card"} · de confirmat` : order.status === "paid" ? "Plătită" : "Ramburs de încasat"],
    ...order.items.map((line): [string,string] => [line.name, `${line.quantity} × ${money(line.unitPriceBani)} · ${line.grind}`]),
    [production ? "Transport" : "Transport inclus", production ? "De confirmat" : money(order.shippingBani)],
    [production ? "Valoare estimată produse" : "Total", money(order.totalBani)],
  ];
  if (shipping) rows.push([shipping.method === "easybox" ? "Livrare easybox" : "Livrare la adresă", [shipping.locker?.name, shipping.line1, shipping.city, shipping.state, shipping.postal_code].filter(Boolean).join(", ")]);
  else if (order.shippingAddress) rows.push(["Livrare", JSON.stringify(order.shippingAddress)]);
  if (details?.billing) rows.push(["Facturare", [details.billing.companyName, details.billing.taxId, details.billing.registrationNumber, details.billing.address].filter(Boolean).join(", ")]);
  if (order.customerNote) rows.push(["Mesaj client", order.customerNote]);
  let adminLink = "";
  try {
    const origin = new URL(process.env.APP_URL || "");
    if (["https:", "http:"].includes(origin.protocol)) adminLink = new URL(`/admin/collections/orders/${order.id}`, origin).href;
  } catch { /* The order remains readable in the email without an admin link. */ }
  const recipient = (process.env.ORDER_NOTIFICATION_EMAIL_TO || process.env.CONTACT_EMAIL_TO || "").trim();
  return {
    to: recipient ? [recipient] : [],
    subject: `Makeon · Comandă nouă ${order.reference}${production ? " · La cerere" : ""}`,
    text: `Comandă nouă Makeon\n\n${rows.map(([label,value]) => `${label}: ${value}`).join("\n")}\n${adminLink ? `\nDeschide în admin: ${adminLink}` : ""}`,
    html: `<div style="font-family:Arial,sans-serif;color:#292621;max-width:680px;margin:auto"><h1>Comandă nouă${production ? " la cerere" : ""}</h1><table style="border-collapse:collapse;width:100%">${rows.map(([label,value]) => `<tr><th style="padding:10px;text-align:left;vertical-align:top;border-bottom:1px solid #d8d4ca">${escape(label)}</th><td style="padding:10px;border-bottom:1px solid #d8d4ca;white-space:pre-wrap;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join("")}</table>${adminLink ? `<p><a href="${escape(adminLink)}">Deschide comanda în admin</a></p>` : ""}</div>`,
  };
}

/** Only registered business orders; abandoned Stripe reservations never trigger this hook. */
export const queueMerchantOrderEmail: CollectionAfterChangeHook = async ({doc, previousDoc, operation, req}) => {
  const registered = doc.orderType === "production" || ["paid", "cod_pending"].includes(doc.status);
  const newlyRegistered = operation === "create" || (previousDoc?.orderType !== "production" && previousDoc?.status === "pending");
  if (!registered || !newlyRegistered) return doc;
  const transactionID = await req.transactionID;
  if (transactionID == null) throw new Error("Notificarea comenzii necesită o tranzacție.");
  await transactionDB(req.payload, transactionID).execute(sql`
    INSERT INTO order_status_emails (event_id, order_id, target_status, audience, body)
    VALUES (${randomUUID()}, ${doc.id}, 'new', 'merchant', ${JSON.stringify(merchantOrderEmail(doc as Order))}::jsonb)
    ON CONFLICT (order_id) WHERE audience = 'merchant' DO NOTHING`);
  scheduleOrderEmails(req, Number(doc.id));
  return doc;
};
