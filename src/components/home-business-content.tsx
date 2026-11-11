"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import ContactRequestForm from "./contact-request-form";

export function HomeArguments() {
  return <section className="home-arguments-band" aria-label="De ce Makeon">
    <div className="b2b-container home-arguments">
      <span>Prăjită proaspăt</span>
      <span>Aparate în comodat</span>
      <span>Filtrare profesională</span>
      <span>Service și aprovizionare</span>
    </div>
  </section>;
}

export function HomeRoastery() {
  return <section className="home-roastery-section" aria-labelledby="home-roastery-title"><div className="b2b-container home-roastery">
    <div className="home-roastery-image"><Image src="/images/roastery/coffee-roaster.jpg" alt="Prăjitorul de cafea din prăjitoria SwitchMORN" fill sizes="(max-width: 800px) 90vw, 45vw" /></div>
    <div><p className="b2b-eyebrow">SwitchMORN · Prăjitoria ta</p><h2 id="home-roastery-title">Din prăjitorie,<br />direct în pauza ta.</h2><p>Cafea proaspăt prăjită, cu profilul potrivit pentru espresso sau filtru. De la cafele de origine la blendul echipei, alegem împreună gustul și planificăm livrările.</p><Link className="b2b-link" href="/prajitoria">Descoperă prăjitoria<ArrowUpRight size={18} aria-hidden="true" /></Link></div>
  </div></section>;
}

const questions = [
  ["Putem avea cafea și apă de la același partener?", "Da. Makeon reunește cafeaua SwitchMORN și soluțiile de apă Vero Aqua. Stabilim împreună echipamentele, aprovizionarea și serviciile pentru biroul tău."],
  ["Cum funcționează comodatul pentru espressor?", "Îți propunem un aparat după numărul de colegi, consum și băuturile preferate. Condițiile de comodat, aprovizionarea și serviciile incluse sunt precizate în ofertă, înainte de instalare."],
  ["Cum ajunge cafeaua proaspătă la birou?", "Cafeaua este proaspăt prăjită și livrată direct din prăjitorie. Alegem sortimentele și stabilim un ritm de livrare în funcție de consumul echipei."],
  ["Cine se ocupă de întreținerea aparatelor?", "Ai un singur partener pentru service și aprovizionare. Abonamentul Vero Aqua prezentat include mentenanță, igienizare și schimb de filtre; pentru espressoare, serviciile se stabilesc în ofertă."],
] as const;

export function HomeQuestions() {
  return <section className="b2b-container home-questions" aria-labelledby="home-questions-title"><div><p className="b2b-eyebrow">Înainte să vorbim</p><h2 id="home-questions-title">Patru răspunsuri utile.</h2></div><dl>{questions.map(([question, answer])=><div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}</dl></section>;
}

export function HomeContact() {
  const [interest,setInterest]=useState("Cafea + apă");
  return <section className="home-contact-section" id="contact" aria-labelledby="home-contact-title"><div className="b2b-container home-contact-grid"><div><p className="b2b-eyebrow">Cafea, apă sau ambele</p><h2 id="home-contact-title">Începem cu o conversație.</h2><p>Spune-ne despre firmă, numărul de colegi și ce ai nevoie la birou. Îți propunem o soluție cu echipamentele, serviciile și costurile explicate clar.</p></div><div className="home-contact-form"><ContactRequestForm interest={interest} onInterestChange={setInterest} idPrefix="home" showWhatsApp={false} /></div></div></section>;
}
