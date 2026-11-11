"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import BusinessShell from "./business-shell";
import { BusinessQuestions } from "./business-sections";
import { eventServices } from "@/lib/service-options";
import { useRef } from "react";
import usePresentationEntrance from "./use-presentation-entrance";

const questions = [
  ["Cum aleg între barul mobil și rulotă?", "Pornim de la locație, amplasarea posibilă, formatul evenimentului și numărul estimativ de invitați. Discutăm împreună ce variantă se potrivește."],
  ["Ce informații trimit pentru ofertă?", "Menționează în câmpul Mesaj data, localitatea, durata și formatul dorit. Numărul estimativ de invitați poate fi ales în formular. Detaliile spațiului ne ajută să discutăm amplasarea."],
  ["Ce servicii sunt incluse?", "Configurația, servirea și condițiile de organizare se confirmă în oferta evenimentului. Serviciile incluse și costurile de transport sau montaj se stabilesc în oferta pentru locația aleasă."],
] as const;

export default function EventLanding() {
  const hero = useRef<HTMLElement>(null);
  usePresentationEntrance(hero, "service");
  return <BusinessShell className="b2b-events-page" initialInterest={eventServices.bar}>{onOffer => <>
    <section ref={hero} className="b2b-container event-intro" aria-labelledby="hero-title" data-presentation="events">
      <div className="event-intro-copy"><h1 className="b2b-title" id="hero-title"><span className="presentation-line-mask"><span data-presentation-line>Dăm gust evenimentului tău.</span></span></h1><p className="b2b-lead" data-presentation-copy>Cafea SwitchMORN la nunți, botezuri, conferințe și lansări. Cu un bar mobil sau o rulotă de cafea, alegem formatul și amplasarea după spațiu și numărul de invitați.</p><div className="b2b-actions" data-presentation-actions><button type="button" className="b2b-btn" onClick={() => onOffer()}>Solicită ofertă pentru eveniment<ArrowUpRight size={18} aria-hidden="true" /></button><a className="b2b-link" href="#formate">Vezi cele două formate<ArrowUpRight size={17} aria-hidden="true" /></a></div></div>
      <div className="event-intro-frame"><div className="event-intro-photo" data-presentation-media><Image src="/images/events/rulota-exterior.webp" alt="Rulota SwitchMORN Coffee cu punctul de servire deschis, la un eveniment în aer liber" fill preload sizes="(max-width: 800px) 90vw, 55vw" /></div></div>
    </section>
    <nav className="b2b-container event-section-nav" aria-label="Pe pagina de evenimente"><a href="#bar-mobil">Stand / bar mobil<ArrowDown size={16} aria-hidden="true" /></a><a href="#rulota">Rulota<ArrowDown size={16} aria-hidden="true" /></a><a href="#detalii-oferta">Detalii pentru ofertă<ArrowDown size={16} aria-hidden="true" /></a></nav>
    <section className="b2b-container b2b-section event-pair-formats" id="formate" aria-labelledby="events-formats-title" data-choreography="event-pair"><h2 className="b2b-heading choreography-line-host" id="events-formats-title"><span className="choreography-heading-mask"><span data-choreo-heading>Stand / bar mobil și rulotă.</span></span><span className="choreography-separator" data-choreo-line aria-hidden="true" /></h2><div className="event-photo-pair event-photo-pair-detail">
      <article className="event-pair-card event-pair-card-stand" id="bar-mobil" aria-labelledby="bar-title" data-choreography="event-card">
        <div className="event-photo-frame"><div className="event-pair-media event-pair-media-stand" data-choreo-media><Image src="/images/events/bar-mobil-makeon.webp" alt="Fotografie completă a barului mobil Coffee Corner SwitchMORN Coffee" fill sizes="(max-width: 700px) min(420px, calc(100vw - 40px)), 36vw" /></div></div>
        <div className="event-pair-copy" data-choreo-caption><h3 className="b2b-heading" id="bar-title">Stand / bar mobil.</h3><p>Un punct de cafea amenajat în interior sau în spațiul disponibil la eveniment. Adaptăm configurația barului și organizarea servirii la locație și numărul de invitați.</p><dl className="event-pair-practical"><div><dt>Discutăm</dt><dd>Spațiul disponibil, amplasarea barului, configurația și detaliile servirii.</dd></div></dl><button type="button" className="b2b-btn event-pair-action" onClick={() => onOffer(eventServices.bar)}>Solicită ofertă pentru stand<ArrowUpRight size={18} aria-hidden="true" /></button></div>
      </article>
      <article className="event-pair-card" id="rulota" aria-labelledby="trailer-title" data-choreography="event-card">
        <div className="event-photo-frame"><div className="event-pair-media event-pair-media-trailer" data-choreo-media><Image src="/images/events/rulota-exterior.webp" alt="Fotografie a rulotei SwitchMORN Coffee și a punctului său de servire" fill sizes="(max-width: 700px) 90vw, 64vw" /></div></div>
        <div className="event-pair-copy" data-choreo-caption><h3 className="b2b-heading" id="trailer-title">Rulotă de cafea.</h3><p>Un punct de servire amenajat în rulotă, pentru evenimente cu spațiu și acces potrivit. Discutăm amplasarea, numărul de invitați și intervalul de servire, de la o petrecere privată la o lansare sau un eveniment de companie.</p><dl className="event-pair-practical"><div><dt>Discutăm</dt><dd>Locația, accesul pentru amplasare și detaliile servirii.</dd></div></dl><button type="button" className="b2b-btn event-pair-action" onClick={() => onOffer(eventServices.trailer)}>Solicită ofertă pentru rulotă<ArrowUpRight size={18} aria-hidden="true" /></button></div>
      </article></div>
    </section>
    <section className="event-enquiry-section" id="detalii-oferta" data-choreography="section"><div className="b2b-container event-enquiry-grid"><div><h2 className="b2b-heading choreography-line-host"><span className="choreography-heading-mask"><span data-choreo-heading>Spune-ne cum arată evenimentul tău.</span></span><span className="choreography-separator" data-choreo-line aria-hidden="true" /></h2><p className="b2b-body" data-choreo-item>Folosește câmpul Mesaj pentru aceste detalii. Confirmăm disponibilitatea, configurația și condițiile în ofertă.</p><button type="button" className="b2b-btn" onClick={() => onOffer()}>Solicită ofertă pentru eveniment<ArrowUpRight size={18} aria-hidden="true" /></button></div><dl className="b2b-details" data-choreo-item><div><dt>Când & unde</dt><dd>Data evenimentului și localitatea.</dd></div><div><dt>Participanți</dt><dd>Numărul estimativ de invitați.</dd></div><div><dt>Durată</dt><dd>Intervalul în care ai nevoie de servire.</dd></div><div><dt>Format & spațiu</dt><dd>Bar mobil sau rulotă, amplasarea și detaliile de acces.</dd></div></dl></div></section>
    <BusinessQuestions questions={questions} />

  </>}</BusinessShell>;
}
