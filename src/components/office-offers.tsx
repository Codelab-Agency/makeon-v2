import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { waterSubscription } from "@/lib/business-content";

/** The same offers adapt to the pinned panel, normal-flow columns and mobile. */
export default function OfficeOffers() {
  return (
    <div
      className="opening-services"
      id="solutii"
      role="region"
      aria-label="Soluții pentru birouri"
    >
      <div className="opening-offer-surface opening-offer-surface-coffee">
        <article
          className="opening-service opening-service-coffee"
          aria-labelledby="opening-coffee-title"
        >
          <div className="opening-service-copy">
            <div className="opening-offer-brand">
              <Image
                className="opening-logo-coffee"
                src="/images/switchmorn-coffee-logo.webp"
                alt="SwitchMORN Coffee"
                width={400}
                height={407}
                sizes="54px"
              />
            </div>
            <h2 id="opening-coffee-title">
              <span className="opening-offer-word" data-word="coffee">
                Cafea
              </span>{" "}
              <span className="opening-offer-continuation">pentru birouri</span>
            </h2>
            <div className="opening-offer-details">
              <p className="opening-service-description">
                Espressor automat, cafea și aprovizionare pentru birou.
              </p>
              <div className="opening-commercial">
                <p className="opening-quote">Ofertă personalizată</p>
                <p className="opening-condition">
                  Instalarea și mentenanța se stabilesc în ofertă.
                </p>
              </div>
              <Link
                className="opening-service-link"
                href="/cafea-pentru-birouri"
              >
                Vezi soluția de cafea
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="opening-equipment opening-equipment-coffee">
            <div className="opening-product-mask">
              <div className="opening-product-scroll">
                <div className="opening-product-interaction">
                  <Image
                    src="/images/coffee-machine-switchmorn.png"
                    alt="Espressor automat SwitchMORN cu ecran tactil"
                    fill
                    sizes="(max-width: 540px) 38vw, (max-width: 1279px) 19vw, 16vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="opening-offer-surface opening-offer-surface-water">
        <article
          className="opening-service opening-service-water"
          aria-labelledby="opening-water-title"
        >
          <div className="opening-service-copy">
            <div className="opening-offer-brand">
              <Image
                className="opening-logo-water"
                src="/images/vero-aqua-logo.webp"
                alt="Vero Aqua"
                width={600}
                height={223}
                sizes="128px"
              />
            </div>
            <h2 id="opening-water-title">
              <span className="opening-offer-word" data-word="water">
                Apă
              </span>{" "}
              <span className="opening-offer-continuation">&amp; filtrare</span>
            </h2>
            <div className="opening-offer-details">
              <p className="opening-service-description">
                Dozator cu trei temperaturi. Instalare, mentenanță și filtre
                incluse.
              </p>
              <div className="opening-commercial">
                <p className="opening-price">
                  <strong>{waterSubscription.monthlyEuro}</strong>{" "}
                  <span className="opening-price-unit">
                    <span>€</span> + TVA / lună
                  </span>
                </p>
                <p className="opening-condition opening-water-term">
                  per aparat{" "}
                </p>
              </div>
              <Link className="opening-service-link" href="/apa">
                Vezi aparatul și abonamentul
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="opening-equipment opening-equipment-water">
            <div className="opening-product-mask">
              <div className="opening-product-scroll">
                <div className="opening-product-interaction">
                  <Image
                    src="/images/vero-aqua-dispenser-black.webp"
                    alt="Dozator vertical Vero Aqua pentru birouri"
                    fill
                    sizes="(max-width: 540px) 34vw, (max-width: 1279px) 17vw, 14vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
