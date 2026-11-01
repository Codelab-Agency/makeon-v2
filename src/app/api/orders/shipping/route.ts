import { getCMS } from "@/lib/cms";
import { allowedRequestOrigin } from "@/lib/request-origin";
import { SamedayError, samedayOptions, samedayPDF } from "@/lib/sameday-client";
import { shipmentPayment } from "@/lib/shipment-payment";
import { shipmentFor, createOrderShipment, attachOrderShipment, orderEasybox } from "@/lib/order-shipping";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };

async function handle(request: Request, mutate: boolean) {
  if (mutate && !allowedRequestOrigin(request))
    return Response.json({ error: "Solicitare nepermisă." }, { status: 403, headers });
  try {
    const cms = await getCMS();
    const { user } = await cms.auth({ headers: request.headers });
    if (!user || user.collection !== "users") return Response.json({ error: "Autentificare necesară." }, { status: 401, headers });
    const url = new URL(request.url);
    const orderID = Number(url.searchParams.get("orderID"));
    if (!Number.isSafeInteger(orderID) || orderID <= 0) throw new SamedayError("Comandă invalidă.", 400);
    const order = await cms.findByID({ collection: "orders", id: orderID, depth: 0, user, overrideAccess: false });
    if (mutate) {
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new SamedayError("Format invalid.", 415);
      const raw = await request.text();
      if (Buffer.byteLength(raw) > 8000) throw new SamedayError("Solicitare prea mare.", 413);
      const body = JSON.parse(raw);
      const shipment = body?.action === "attach"
        ? await attachOrderShipment(cms, orderID, body.number)
        : await createOrderShipment(cms, orderID, body);
      return Response.json({ shipment }, { headers });
    }
    const shipment = await shipmentFor(cms, orderID);
    if (url.searchParams.has("pdf")) {
      if (shipment?.state !== "created" || !shipment.number) throw new SamedayError("Comanda nu are AWB emis.", 409);
      const format = url.searchParams.get("pdf") === "A6" ? "A6" : "A4";
      const bytes = await samedayPDF(shipment.number, format);
      return new Response(bytes, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="AWB-${shipment.number}-${format}.pdf"` } });
    }
    const payment = shipmentPayment(order);
    const options = payment.allowed && (!shipment || shipment.state === "rejected") ? await samedayOptions() : null;
    if(options)options.services=options.services.filter(service=>service.deliveryMethod===(orderEasybox(order)?"easybox":"address"));
    return Response.json({ shipment, options, payment }, { headers });
  } catch (error) {
    if (error instanceof SamedayError) return Response.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof SyntaxError) return Response.json({ error: "Date invalide." }, { status: 400, headers });
    console.error("Order shipment failed", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "AWB-ul nu poate fi verificat momentan. Reîncarcă pentru a verifica rezultatul înainte de o nouă încercare." }, { status: 503, headers });
  }
}

export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
