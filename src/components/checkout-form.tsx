"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { useCart } from "./cart-provider";
import { useCatalog } from "./catalog-provider";
import CheckoutFields from "./checkout-fields";
import ProductionRequestForm from "./production-request-form";
import { needsProductionRequest } from "@/lib/cart-availability";
import OrderLegalAcknowledgement from "./order-legal-acknowledgement";
import { checkoutDetailsFromForm } from "@/lib/checkout-details";
import { money } from "@/lib/coffee-catalog";
import { legal } from "@/lib/legal";

export default function CheckoutForm() {
  const cart = useCart(), catalog = useCatalog();
  const [terms, setTerms] = useState(false), [sending, setSending] = useState(false), [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [delivery,setDelivery]=useState<"address"|"easybox">("address");
  const shippingBani=delivery==="easybox" ? (catalog.easyboxShippingBani??catalog.shippingBani??0) : (catalog.shippingBani??0);
  const busy = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => { attempt.current = null; }, [cart.checkoutRecovery.revision]);
  const products = cart.items.map(line => ({ ...line, product: catalog.products.find(p => p.slug === line.slug) }));
  const knownProducts = products.length > 0 && products.every(line => line.product);
  const requested = catalog.managed && knownProducts && needsProductionRequest(cart.items, catalog.products);
  const available = knownProducts && products.every(line => line.product?.price != null && line.product.stock != null);
  const subtotal = products.reduce((sum, line) => sum + (line.product?.price ?? 0) * line.quantity, 0);
  if (reference) return <section className="checkout-result section-padding" role="status">
    <Check size={36} aria-hidden="true" /><h1>Mulțumim pentru comandă.</h1>
    <p>{delivery==="easybox"?"Comanda ramburs a fost înregistrată. Vei achita produsele și transportul la ridicarea coletului din easybox.":"Comanda ramburs a fost înregistrată. Vei achita produsele și transportul la livrare."}</p>
    <p>Referință comandă: <strong>{reference}</strong></p><Link className="primary-button" href="/cafea">Înapoi la magazin</Link>
  </section>;
  if (cart.checkoutRecovery.busy || cart.checkoutRecovery.error) return <section className="checkout-result section-padding">
    <h1>Revenim la coșul tău.</h1>
    {cart.checkoutRecovery.error ? <><p role="alert">{cart.checkoutRecovery.error}</p><button className="primary-button" type="button" onClick={() => void cart.checkoutRecovery.retry()}>Reîncearcă</button></> : <p role="status">Eliberăm produsele rezervate la plata anterioară…</p>}
  </section>;
  if (!catalog.ready) return <p className="section-padding" role="status">Verificăm coșul…</p>;
  if (!catalog.unavailable && requested) return <div className="checkout-page section-padding">
    <header className="checkout-page-heading"><Link href="/cafea">← Înapoi la magazin</Link><h1>Comandă la cerere.</h1><p>Înregistrăm selecția și datele tale. Te contactăm pentru confirmarea prețului și a termenului.</p></header>
    <ProductionRequestForm items={cart.items} onComplete={snapshot => { cart.clear(snapshot); catalog.refresh(); }} />
  </div>;
  if (catalog.unavailable || !available || (!catalog.checkout && !catalog.cod)) return <section className="checkout-result section-padding">
    <h1>Verifică selecția ta.</h1><p>Deschide coșul pentru disponibilitate și opțiunile de comandă.</p>
    <button type="button" className="primary-button" onClick={cart.open}>Deschide coșul</button>
  </section>;
  return <div className="checkout-page section-padding">
    <header className="checkout-page-heading"><Link href="/cafea">← Înapoi la magazin</Link><h1>Finalizează comanda.</h1><p>Datele tale, livrarea și plata, într-un singur loc.</p></header>
    <div className="checkout-page-grid">
      <form className="checkout-form" aria-busy={sending} onSubmit={async event => {
        event.preventDefault();
        if (busy.current || !terms) return;
        busy.current = true; setSending(true); setError("");
        try {
          const details = checkoutDetailsFromForm(new FormData(event.currentTarget));
          const snapshot = JSON.stringify(cart.items);
          const fingerprint = JSON.stringify({ items: cart.items, details, legalVersion: legal.version });
          if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
          const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart.items, details, key: attempt.current.key, termsAccepted: terms, legalVersion: legal.version }) });
          const result = await response.json();
          if (!response.ok) {
            if (response.status === 409) attempt.current = null;
            throw new Error(result.error || "Comanda nu a putut fi înregistrată.");
          }
          if (result.paymentMethod === "cod" && result.reference) {
            setReference(result.reference);
            cart.clear(snapshot);
            catalog.refresh();
          } else if (result.url) {
            sessionStorage.setItem("makeon-checkout-cart", snapshot);
            sessionStorage.setItem("makeon-checkout-key", attempt.current.key);
            window.location.assign(result.url);
          } else throw new Error("Răspuns invalid. Reîncearcă fără să modifici comanda.");
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Reîncearcă în câteva momente."); }
        finally { busy.current = false; setSending(false); }
      }}>
        <fieldset className="checkout-form-content" disabled={sending}>
          <legend className="sr-only">Datele comenzii</legend>
          <CheckoutFields card={catalog.checkout} cod={catalog.cod} onDeliveryChange={setDelivery} />
          <OrderLegalAcknowledgement checked={terms} onChange={setTerms} disabled={sending} />
          {error && <p className="checkout-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={sending || !terms}>{sending ? "Se procesează…" : "Trimite comanda"}<ArrowUpRight size={18} aria-hidden="true" /></button>
        </fieldset>
      </form>
      <aside className="checkout-summary" aria-label="Rezumat comandă">
        <h2>Comanda ta</h2>
        <ul>{products.map(line => <li key={`${line.slug}-${line.grind}`}><span><strong>{line.product!.name}</strong><small>{line.grind} · {line.quantity} buc.</small></span><span>{money(line.product!.price! * line.quantity)}</span></li>)}</ul>
        <dl><div><dt>Produse</dt><dd>{money(subtotal)}</dd></div><div><dt>{delivery==="easybox"?"Transport · easybox":"Transport"}</dt><dd>{money(shippingBani / 100)}</dd></div><div className="checkout-grand-total"><dt>Total de plată</dt><dd>{money(subtotal + shippingBani / 100)}</dd></div></dl>
        <button className="text-link" type="button" onClick={cart.open}>Modifică selecția</button>
      </aside>
    </div>
  </div>;
}
