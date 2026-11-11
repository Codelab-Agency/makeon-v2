"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import BusinessShell from "./business-shell";
import { BusinessShopPreview } from "./business-sections";

export default function RoasteryLanding() {
  return <BusinessShell className="b2b-roastery">{onOffer=><>
    <section className="b2b-container roastery-hero" aria-labelledby="hero-title"><div><p className="b2b-eyebrow">SwitchMORN · Prăjitoria ta</p><h1 className="b2b-title" id="hero-title">Cafea proaspăt prăjită.<br />Direct din prăjitorie.</h1><p className="b2b-lead">Origini, blenduri și profiluri de prăjire alese pentru felul în care îți bei cafeaua. Pentru birou, acasă sau cafenea, pornim de la gust.</p><div className="b2b-actions"><Link className="b2b-btn" href="#magazin">Vezi sortimentele<ArrowUpRight size={18} aria-hidden="true" /></Link><button className="b2b-link" onClick={()=>onOffer("Cafea de probă")}>Solicită cafea de probă<ArrowUpRight size={18} aria-hidden="true" /></button></div></div><div className="roastery-hero-image"><Image src="/images/roastery/coffee-roaster.jpg" alt="Prăjitorul de cafea din prăjitoria SwitchMORN" fill preload sizes="(max-width: 800px) 90vw, 50vw" /></div></section>
    <section className="roastery-story-section" aria-labelledby="roastery-story-title">
      <div className="b2b-container roastery-story">
        <div className="roastery-story-copy">
          <p className="b2b-eyebrow">Din prăjitorie</p>
          <h2 id="roastery-story-title">Fiecare lot, urmărit de aproape.</h2>
          <p>Prăjim în loturi mici, verificăm boabele și alegem profilul potrivit pentru espresso sau filtru. Cafeaua pleacă proaspătă, direct din prăjitorie.</p>
        </div>
        <div className="roastery-story-media">
          <div className="roastery-story-main"><Image src="/images/roastery/fresh-roast.jpg" alt="Cafea proaspăt prăjită în cuva de răcire" fill sizes="(max-width: 800px) 85vw, 45vw" /></div>
          <div className="roastery-story-detail"><Image src="/images/roastery/roast-sample.jpg" alt="Boabe de cafea verificate în timpul prăjirii" fill sizes="(max-width: 800px) 40vw, 18vw" /></div>
        </div>
      </div>
    </section>
    <BusinessShopPreview title="Alege-ți cafeaua." description="O selecție de cafele SwitchMORN. Descoperă toate sortimentele și opțiunile de măcinare în magazin." showEyebrow={false} />
    <section className="b2b-container roastery-details" aria-labelledby="roastery-details-title"><h2 className="b2b-heading" id="roastery-details-title">De la origine la metoda de preparare.</h2><div className="roastery-detail-grid"><article><h3>Origini cu personalitate</h3><p>Explorează cafele din Etiopia, Brazilia, Columbia sau Guatemala. Țara, regiunea și notele de gust sunt prezentate în fișa fiecărui sortiment; disponibilitatea se verifică în catalog.</p></article><article><h3>Prăjire în loturi mici</h3><p>Prăjim proaspăt și ajustăm profilul pentru espresso sau filtru: V60, Chemex ori AeroPress. Alegerea începe cu băutura pe care vrei să o pregătești.</p></article><article><h3>Blendul echipei tale</h3><p>Discutăm preferințele și consumul, apoi alegem sortimentele sau un blend personalizat. Livrăm direct din prăjitorie, la intervalele stabilite împreună.</p></article></div><button className="b2b-btn" onClick={()=>onOffer("Prăjire și blenduri personalizate")}>Discutăm despre cafeaua ta<ArrowUpRight size={18} aria-hidden="true" /></button></section>
  </>}</BusinessShell>;
}
