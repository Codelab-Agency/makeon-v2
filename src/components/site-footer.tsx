"use client";
import Link from "next/link";
import BrandLogo from "./brand-logo";
import LegalFooter from "./legal-footer";
import { legal } from "@/lib/legal";
export default function SiteFooter({ onOffer, offerAnchor }: { onOffer?: () => void; offerAnchor?: string }) {
  return <footer className="site-footer" id={offerAnchor || "footer"}><div className="b2b-container">
    <div className="site-footer-top">
      <div className="site-footer-identity"><BrandLogo light /><p>Cafea, apă și echipamente pentru companii.<br />Un singur furnizor.</p><div className="site-footer-contact"><a href={legal.phoneHref}>{legal.phone}</a><a href={`mailto:${legal.email}`}>{legal.email}</a></div></div>
      <div className="site-footer-navigation"><nav aria-label="Servicii și magazin"><p>Servicii & magazin</p><Link href="/cafea-pentru-birouri">Cafea pentru birouri</Link><Link href="/apa">Apă & filtrare</Link><Link href="/cafea-la-evenimente">Cafea la evenimente</Link><Link href="/cafea">Sortimente</Link></nav><nav aria-label="Makeon și informații utile"><p>Makeon</p><Link href="/#contact">Contact</Link><Link href="/apa#filtre">Filtre și mentenanță</Link><Link href="/prajitoria">Prăjitoria</Link>{onOffer ? <button type="button" onClick={onOffer}>Solicită ofertă</button> : <Link href="/#abonamente">Solicită ofertă</Link>}</nav></div>
    </div>
    <div className="site-footer-utility"><LegalFooter /><p>© {new Date().getFullYear()} Makeon</p>{legal.company.name && <p>{legal.company.name}</p>}</div>
  </div></footer>;
}
