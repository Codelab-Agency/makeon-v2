"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import useHomeOpeningMotion from "./use-home-opening-motion";

export default function CombinedHero({ onOffer }: { onOffer: () => void }) {
  const opening = useRef<HTMLElement>(null);
  useHomeOpeningMotion(opening);
  return (
    <section ref={opening} className="home-opening" aria-labelledby="hero-title">
      <div className="opening-stage">
        <div className="opening-atmosphere">
          <div className="opening-copy">
            <div className="opening-copy-main">
              <p className="opening-eyebrow">MAKEON <span aria-hidden="true">/</span> SOLUȚII PENTRU BIROU</p>
              <h1 id="hero-title">
                <span className="opening-line-mask"><span className="opening-title-line">Pauza de cafea și</span></span>{" "}
                <span className="opening-line-mask"><span className="opening-title-line">pauza de hidratare,</span></span>{" "}
                <span className="opening-line-mask"><span className="opening-title-line">rezolvate pentru biroul tău.</span></span>
              </h1>
              <div className="opening-copy-follow">
                <p className="opening-description">
                  Cafea de origine, proaspăt prăjită și livrată direct din prăjitorie,
                  espressoare în comodat și apă cu filtrare profesională.
                  Echipamente, service și aprovizionare, cu un singur partener.
                </p>
                <div className="opening-actions">
                  <button type="button" className="b2b-btn" onClick={onOffer}>
                    Solicită ofertă pentru birou
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </button>
                  <Link href="#solutii">Vezi soluțiile <ArrowUpRight size={16} aria-hidden="true" /></Link>
                </div>
              </div>
            </div>
            <div className="opening-discovery">
              <Link className="opening-preview" href="/prajitoria" aria-label="Descoperă prăjitoria Makeon">
                <span className="opening-preview-image"><Image src="/images/switchmorn-coffee-corner.webp" alt="Cafea SwitchMORN pregătită pentru un eveniment" fill sizes="(max-width: 800px) 45vw, 220px" /></span>
                <span className="opening-preview-copy"><span>DIN PRĂJITORIE</span><strong>Cafea proaspăt prăjită.</strong><span>Descoperă povestea <ArrowUpRight size={15} aria-hidden="true" /></span></span>
              </Link>
              <div className="opening-seal" aria-label="Cafea și apă, un singur partener"><span>Cafea + apă</span><strong>un singur<br />partener</strong><ArrowUpRight size={20} aria-hidden="true" /></div>
            </div>
          </div>
          <div className="opening-photo-mask">
            <div className="opening-photo-pan">
              <div className="opening-photo-enter">
                <Image
                  src="/images/makeon-office-hero-v2.webp"
                  alt="Espressor SwitchMORN și dozator Vero Aqua într-un spațiu de birou"
                  fill
                  preload
                  sizes="(max-width: 800px) 100vw, 52vw"
                />
              </div>
            </div>
            <div className="opening-photo-caption" aria-hidden="true"><span>MAKEON / CAFEA ȘI APĂ</span><span>O pauză mai bună, în fiecare zi.</span></div>
          </div>
        </div>
        <div className="opening-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
