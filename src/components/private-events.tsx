import { ArrowUpRight, CalendarDays } from "lucide-react";
import Image from "next/image";
import { eventServices } from "@/lib/service-options";

export default function PrivateEvents({
  onOffer,
}: {
  onOffer: (selection: string) => void;
}) {
  return (
    <section
      className="private-events section-padding"
      id="evenimente"
      aria-labelledby="events-title"
    >
      <div className="section-top reveal">
        <span className="eyebrow">
          <CalendarDays size={14} /> MAKEON / EVENIMENTE PRIVATE
        </span>
        <span className="section-index">NE VEDEM LA EVENIMENTUL TĂU</span>
      </div>
      <div className="events-heading reveal">
        <h2 id="events-title">
          Dăm gust
          <br />
          <span>evenimentului tău.</span>
        </h2>
        <p>
          Rulotă și bar mobil pentru evenimente private. Alegem împreună
          formatul potrivit locației, numărului de invitați și atmosferei pe
          care vrei să o creezi.
        </p>
      </div>
      <div className="events-grid">
        {[
          {
            title: "Rulotă",
            label: "CAFEA ÎN AER LIBER",
            text: "Cafeaua preferată, într-un loc în care invitații se adună cu plăcere. Alegem împreună amplasarea rulotei și detaliile servirii.",
            service: eventServices.trailer,
          },
          {
            title: "Barul mobil",
            label: "COFFEE CORNER LA EVENIMENT",
            text: "Un colț de cafea care se integrează în evenimentul tău. Adaptăm configurația barului și servirea la spațiul și invitații tăi.",
            service: eventServices.bar,
          },
        ].map((setup, i) => (
          <article className="event-card reveal" key={setup.service}>
            <div className="event-art">
              <div className="event-photo-window">
                <Image
                  src={`/images/events/${i === 0 ? "rulota-exterior" : "bar-mobil-makeon"}.webp`}
                  alt={
                    i === 0
                      ? "Rulota SwitchMorn Coffee, la un eveniment în aer liber"
                      : "Barul mobil SwitchMorn Coffee, amenajat pentru un eveniment"
                  }
                  fill
                  sizes="(max-width: 620px) 100vw, 50vw"
                  className={`event-photo${i === 1 ? " event-photo-bar" : ""}`}
                />
              </div>
            </div>
            <div className="event-card-copy">
              <span className="event-art-label">{setup.label}</span>
              <h3>{setup.title}</h3>
              <p>{setup.text}</p>
              <button
                className="text-link"
                onClick={() => onOffer(setup.service)}
              >
                Solicită ofertă pentru {i === 0 ? "rulotă" : "barul mobil"}
                <ArrowUpRight size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="events-note reveal">
        Spune-ne data, localitatea și numărul estimativ de invitați.
        Disponibilitatea și detaliile se confirmă în ofertă.
      </p>
    </section>
  );
}
