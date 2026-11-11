"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Headphones,
  PackageCheck,
  Plug,
  RefreshCw,
  Snowflake,
  Sun,
  Thermometer,
  Wrench,
} from "lucide-react";
import BusinessShell from "./business-shell";
import { BusinessQuestions } from "./business-sections";
import { waterQuestions, waterSubscription } from "@/lib/business-content";
import usePresentationEntrance from "./use-presentation-entrance";

const inclusions = [
  {
    Icon: PackageCheck,
    title: waterSubscription.includes[0],
    text: "Dozator Vero Aqua pentru spațiul tău.",
  },
  { Icon: Plug, title: "Instalare", text: "Montaj și punere în funcțiune." },
  {
    Icon: Wrench,
    title: "Mentenanță",
    text: waterSubscription.includes[2] + ".",
  },
  {
    Icon: RefreshCw,
    title: "Înlocuirea filtrelor",
    text: "Schimburi incluse în abonament.",
  },
  {
    Icon: Headphones,
    title: "Asistență tehnică",
    text: "Un partener la care poți apela.",
  },
];
const filtration = ["Sediment", "Cărbune activ", "Carbon block", "Membrană UF"];

export default function WaterLanding() {
  const hero = useRef<HTMLDivElement>(null);
  usePresentationEntrance(hero, "service");

  return (
    <BusinessShell
      className="b2b-water water-service-page"
      initialInterest="Consultanță pentru filtrarea apei"
    >
      {(onOffer) => (
        <>
          <section
            className="water-page-opening"
            id="abonamente"
            aria-labelledby="hero-title"
          >
            <div
              ref={hero}
              className="b2b-container water-page-hero"
              data-presentation="water"
            >
              <div className="water-page-copy">
                <Image
                  className="water-page-logo"
                  src="/images/vero-aqua-logo.webp"
                  alt="Vero Aqua"
                  width={148}
                  height={55}
                />
                <p className="water-page-eyebrow">
                  Apă filtrată pentru echipa ta
                </p>
                <h1 id="hero-title">
                  <span className="presentation-line-mask">
                    <span data-presentation-line>Hidratare fără</span>
                  </span>{" "}
                  <span className="presentation-line-mask">
                    <span data-presentation-line>compromis, la biroul tău.</span>
                  </span>
                </h1>
                <p className="water-page-lead" data-presentation-copy>
                  Filtrare profesională și apă la îndemână toată ziua: rece, caldă
                  sau la temperatura camerei. Dozator Vero Aqua, instalare și întreținere,
                  cu un singur partener.
                </p>
                <div
                  className="water-page-plan"
                  data-service="water"
                  data-presentation-actions
                >
                  <p className="water-page-plan-label">Abonament Vero Aqua</p>
                  <div className="b2b-price">
                    <strong>{waterSubscription.monthlyEuro} €</strong>
                    <span>+ TVA / lună</span>
                  </div>
                  <p className="water-contract">Per aparat </p>
                  <button
                    type="button"
                    className="b2b-btn"
                    onClick={() => onOffer(waterSubscription.interest)}
                  >
                    Solicită abonamentul Vero Aqua
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <figure className="water-page-showcase" id="solutii">
                <div
                  className="water-page-product-surface"
                  data-presentation-media
                >
                  <div
                    className="water-page-apparatus"
                    data-presentation-product
                  >
                    <Image
                      src="/images/vero-aqua-dispenser-black.webp"
                      alt="Dozatorul de apă Vero Aqua prezentat în oferta pentru birouri"
                      fill
                      preload
                      sizes="(max-width: 700px) 180px, 260px"
                    />
                  </div>
                  <div
                    className="water-page-temperatures"
                    role="group"
                    aria-label="Temperaturile apei"
                  >
                    <span>
                      <Snowflake size={17} aria-hidden="true" />
                      Rece
                    </span>
                    <span>
                      <Thermometer size={17} aria-hidden="true" />
                      Caldă
                    </span>
                    <span>
                      <Sun size={17} aria-hidden="true" />
                      Ambientală
                    </span>
                  </div>
                </div>
              </figure>
            </div>
            <div className="b2b-container water-page-reassurance">
              <p>
                <Check size={17} aria-hidden="true" />
                Instalare, mentenanță și filtre incluse
              </p>
              <a href="#incluse">
                Vezi ce primești
                <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>

            <section
              className="b2b-container water-page-inclusions"
              id="incluse"
              aria-labelledby="water-offer-title"
            >
              <div className="water-page-section-head">
                <div>
                  <p className="water-page-eyebrow">
                    Un abonament. Un singur partener.
                  </p>
                  <h2 id="water-offer-title">
                    Noi ne ocupăm de aparat.
                    <br />
                    Tu îți vezi de zi.
                  </h2>
                </div>
              </div>
              <div className="water-team-benefits">
                <div><h3>Apă la îndemână toată ziua</h3><p>Trei temperaturi pentru pauzele și băuturile echipei.</p></div>
                <div><h3>Mai puțin plastic</h3><p>Un dozator și recipiente reutilizabile reduc nevoia sticlelor de unică folosință.</p></div>
                <div><h3>Mai puțină logistică</h3><p>Un singur partener pentru aparat, întreținere și schimbul filtrelor.</p></div>
              </div>
              <div className="water-page-included-panel">
                <div className="water-page-included-intro">
                  <p className="water-page-eyebrow">Servicii incluse</p>
                  <h3>Ce primești în abonament</h3>
                  <p>De la instalare la întreținere, serviciile pentru dozator sunt incluse în abonament.</p>
                </div>
                <ul className="water-page-inclusion-grid">
                  {inclusions.map(({ Icon, title, text }) => (
                    <li key={title}>
                      <span className="water-page-icon">
                        <Icon size={23} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="water-page-fineprint">
                Oferta este exclusiv pentru apă. Configurația, cerințele de
                instalare și condițiile finale se confirmă la contractare.
              </p>
            </section>
          </section>

          <section
            className="water-page-filtration"
            id="filtre"
            aria-labelledby="water-filters-title"
          >
            <div className="b2b-container water-page-filter-grid">
              <figure className="water-page-filters">
                <div className="b2b-filter-media">
                  <Image
                    src="/images/filtration/four-filters.webp"
                    alt="Sistemul ilustrat cu filtre pentru sediment, cărbune activ, carbon block și membrană UF"
                    fill
                    sizes="(max-width: 800px) 90vw, 50vw"
                  />
                </div>
                <figcaption>
                  Configurația de filtrare a modelului prezentat.
                </figcaption>
              </figure>
              <div className="water-page-filter-copy">
                <p className="water-page-eyebrow">Vero Aqua · Filtrare</p>
                <h2 id="water-filters-title">
                  Patru stadii de filtrare.
                  <br />
                  Și lampă UV.
                </h2>
                <p>
                  Un sistem integrat în dozatorul din ofertă. Verificăm
                  configurația și compatibilitatea pentru aparatul ales.
                </p>
                <ol className="water-page-filter-stages">
                  {filtration.map((name, index) => (
                    <li key={name}>
                      <span>0{index + 1}</span>
                      {name}
                    </li>
                  ))}
                </ol>
                <a className="b2b-link" href="#servicii">
                  Ai deja un sistem de filtrare?
                  <ArrowDown size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>

          <section
            className="b2b-container water-page-existing"
            id="servicii"
            aria-labelledby="water-existing-title"
          >
            <div className="water-page-service-panel">
              <div className="water-page-section-head">
                <div>
                  <p className="water-page-eyebrow">
                    Servicii pentru sistemul tău
                  </p>
                  <h2 id="water-existing-title">
                    Ai aparatul.
                    <br />
                    Ai nevoie de un partener?
                  </h2>
                </div>
                <p>
                  Te ajutăm cu instalarea, mentenanța sau alegerea filtrelor
                  compatibile cu echipamentul existent.
                </p>
              </div>
              <div className="water-page-services">
                <div>
                  <Plug size={24} aria-hidden="true" />
                  <h3>Instalare</h3>
                  <p>Montaj adaptat spațiului și aparatului.</p>
                </div>
                <div>
                  <Wrench size={24} aria-hidden="true" />
                  <h3>Mentenanță</h3>
                  <p>Verificări și intervale stabilite în ofertă.</p>
                </div>
                <div>
                  <RefreshCw size={24} aria-hidden="true" />
                  <h3>Schimb de filtre</h3>
                  <p>Compatibilitate verificată pentru sistemul existent.</p>
                </div>
              </div>
              <div className="water-page-service-action">
                <p>
                  Lucrările și costurile pentru alte sisteme se stabilesc
                  separat de abonamentul Vero Aqua.
                </p>
                <button
                  type="button"
                  className="b2b-btn"
                  onClick={() => onOffer("Consultanță pentru filtrarea apei")}
                >
                  Solicită ofertă pentru apă
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
          <BusinessQuestions questions={waterQuestions} initialOpen={null} />
        </>
      )}
    </BusinessShell>
  );
}
