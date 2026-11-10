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
          <div className="opening-photo-mask">
            <div className="opening-photo-pan">
              <div className="opening-photo-enter">
                <Image
                  src="/images/makeon-office-hero-v2.webp"
                  alt="Espressor SwitchMORN și dozator Vero Aqua într-un spațiu de birou"
                  fill
                  preload
                  sizes="(max-width: 800px) 100vw, 55vw"
                />
              </div>
            </div>
          </div>
          <div className="opening-copy">
            <p className="opening-eyebrow">Makeon · Soluții pentru companii</p>
            <h1 id="hero-title">
              <span className="opening-line-mask">
                <span className="opening-title-line">Pauza de cafea și</span>{" "}
              </span>
              <span className="opening-line-mask">
                <span className="opening-title-line">pauza de hidratare,</span>{" "}
              </span>
              <span className="opening-line-mask">
                <span className="opening-title-line">rezolvate pentru biroul tău.</span>
              </span>
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
                <Link href="#solutii">
                  Vezi soluțiile
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="opening-benefits">
                <span>SwitchMORN Coffee</span>
                <span>Vero Aqua</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
