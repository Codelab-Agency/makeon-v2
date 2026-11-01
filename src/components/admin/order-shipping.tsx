"use client";

import { useEffect, useId, useState } from "react";
import type { ShipmentPayment } from "@/lib/shipment-payment";
import type { Order } from "@/payload-types";
import type { CheckoutDetails } from "@/lib/checkout-details";

type Shipment = { state: string; number: string | null; error: string | null; environment: string; canAttach: boolean };
type Option = { id: number; name: string };
type Options = { environment: string; pickupPoints: Option[]; services: Option[] };
const text = (value: unknown) => typeof value === "string" ? value : "";

export default function OrderShipping({ order }: { order: Order }) {
  const uid = useId();
  const details=order.checkoutDetails as CheckoutDetails | null;
  const locker=details?.shipping?.method==="easybox"?details.shipping.locker:undefined;
  const shipping = order.shippingAddress as Record<string, unknown> | null;
  const address = (shipping?.address || shipping || {}) as Record<string, unknown>;
  const [fields, setFields] = useState({
    name: text(shipping?.name) || order.customerName || "",
    phone: text(shipping?.phone) || order.customerPhone || "",
    county: text(address.state), city: text(address.city),
    address: [text(address.line1), text(address.line2)].filter(Boolean).join(", "),
    postalCode: text(address.postal_code), weight: "", pickupPoint: "", service: "",
  });
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [payment, setPayment] = useState<ShipmentPayment | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState("");
  const endpoint = `/api/orders/shipping?orderID=${order.id}`;
  const apply = (body: { shipment: Shipment | null; options: Options | null; payment: ShipmentPayment }) => {
    setShipment(body.shipment); setOptions(body.options); setPayment(body.payment);
    if (body.options) setFields(previous => ({ ...previous,
      pickupPoint: previous.pickupPoint || (body.options!.pickupPoints.length === 1 ? String(body.options!.pickupPoints[0].id) : ""),
      service: previous.service || (body.options!.services.length === 1 ? String(body.options!.services[0].id) : ""),
    }));
  };
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        apply(body);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "AWB indisponibil.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [endpoint]);
  const reload = async () => {
    const response = await fetch(endpoint);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    apply(body);
  };
  const mutate = async (body: object) => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setShipment(result.shipment); setOptions(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Rezultatul nu este confirmat. Verifică înainte să reîncerci.");
      try { await reload(); } catch { /* Keep the first failure visible. */ }
    } finally { setBusy(false); }
  };
  return (
    <section className="makeon-order-panel makeon-shipping" aria-labelledby={`${uid}-heading`}>
      <h3 id={`${uid}-heading`}>Livrare Sameday · AWB</h3>
      {loading && <p role="status">Se verifică expedierea…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && shipment?.state === "created" && <>
        <p role="status"><strong>AWB {shipment.number}</strong>{shipment.environment === "sandbox" ? " · TEST" : ""}</p>
        <div className="makeon-shipping-actions">
          <a className="btn btn--style-primary" href={`${endpoint}&pdf=A4`}>Descarcă PDF A4</a>
          <a className="btn btn--style-secondary" href={`${endpoint}&pdf=A6`}>Descarcă PDF A6</a>
        </div>
        <p>Emiterea AWB-ului nu marchează comanda ca expediată. Actualizează statusul la predarea coletului.</p>
      </>}
      {!loading && shipment && ["sending", "uncertain"].includes(shipment.state) && <>
        <p>{shipment.error || "Emiterea este în curs sau rezultatul nu a fost încă salvat."}</p>
        <p>Verifică în eAWB referința <strong>{order.reference}</strong>. O nouă emitere este blocată pentru a evita dublarea expedierii.</p>
        {shipment.canAttach && <div className="makeon-shipping-recovery">
          <label htmlFor={`${uid}-recovery`}>AWB-ul găsit în eAWB pentru această comandă</label>
          <input id={`${uid}-recovery`} value={recovery} onChange={event => setRecovery(event.target.value)} disabled={busy} />
          <button type="button" className="btn btn--style-secondary" disabled={busy || !recovery.trim()} onClick={() => void mutate({ action: "attach", number: recovery.trim() })}>Asociază AWB existent</button>
        </div>}
      </>}
      {!loading && payment && !payment.allowed && (!shipment || shipment.state === "rejected") && <p>{payment.reason}</p>}
      {!loading && payment?.allowed && options && (!shipment || shipment.state === "rejected") && <>
        <p>{locker?"Livrare la easybox în România, un colet.":"Livrare la adresă în România, un colet."} {payment.cashOnDeliveryBani > 0 ? `Ramburs de încasat: ${new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(payment.cashOnDeliveryBani / 100)} (produse + transport).` : "De încasat la livrare: 0,00 RON. Plata este deja achitată."} Verifică destinatarul și greutatea coletului ambalat.</p>
        {locker && <p><strong>{locker.name}</strong> · ID {locker.id}. AWB-ul va folosi acest easybox; adresa de mai jos nu îl poate înlocui.</p>}
        {!options.services.length && <p role="alert">Contul Sameday nu are un serviciu disponibil pentru metoda de livrare a comenzii.</p>}
        {options.environment === "sandbox" && <p><strong>Mediu de test — AWB fără livrare reală.</strong></p>}
        <fieldset disabled={busy} className="makeon-shipping-fields">
          <legend className="makeon-shipping-legend">Date pentru AWB</legend>
          {([
            ["name", "Destinatar"], ["phone", "Telefon"], ["county", "Județ (denumire completă)"],
            ["city", "Localitate"], ["address", "Stradă, număr și detalii adresă"], ["postalCode", "Cod poștal (opțional)"],
          ] as const).map(([key, label]) => <label key={key} htmlFor={`${uid}-${key}`}>
            {label}<input id={`${uid}-${key}`} value={fields[key]} readOnly={Boolean(locker) && ["county","city","address","postalCode"].includes(key)} onChange={event => setFields(previous => ({ ...previous, [key]: event.target.value }))} />
          </label>)}
          <label htmlFor={`${uid}-weight`}>Greutate totală colet (kg)
            <input id={`${uid}-weight`} type="number" min="0.01" max="31.5" step="0.01" inputMode="decimal" placeholder="Ex. 1.25" value={fields.weight} onChange={event => setFields(previous => ({ ...previous, weight: event.target.value }))} />
          </label>
          {([ ["pickupPoint", "Punct de ridicare", options.pickupPoints], ["service", "Serviciu", options.services] ] as const).map(([key, label, items]) => <label key={key} htmlFor={`${uid}-${key}`}>
            {label}<select id={`${uid}-${key}`} value={fields[key]} onChange={event => setFields(previous => ({ ...previous, [key]: event.target.value }))}>
              <option value="">Alege…</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>)}
        </fieldset>
        <p>Modificările de mai sus se aplică doar AWB-ului. Adresa originală a comenzii se păstrează.</p>
        <button type="button" className="btn btn--style-primary" disabled={busy || !options.pickupPoints.length || !options.services.length} onClick={() => void mutate({ ...fields, weight: Number(fields.weight), pickupPoint: Number(fields.pickupPoint), service: Number(fields.service) })}>
          {busy ? "Se emite AWB-ul…" : "Emite AWB pentru această comandă"}
        </button>
      </>}
      {!loading && <button type="button" className="btn btn--style-secondary" disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try { await reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Reîncearcă mai târziu."); }
        finally { setBusy(false); }
      }}>Verifică din nou</button>}
    </section>
  );
}
