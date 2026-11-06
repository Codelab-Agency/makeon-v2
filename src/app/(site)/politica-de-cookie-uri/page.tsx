import type { Metadata } from "next";
import LegalDocument, { CompanyDetails, LegalContact } from "@/components/legal-document";
import { legal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata(legal.cookies, "Politica de cookie-uri | Makeon", "Cum folosește site-ul Makeon cookie-uri și stocarea în browser pentru coș, funcțiile magazinului și serviciile integrate."),
  robots: legal.draft ? { index: false, follow: true } : undefined,
};

export default function CookiesPage() {
  return (
    <LegalDocument title="Politica de cookie-uri">
      <section>
        <h2>Operatorul site-ului</h2>
        <p>Site-ul Makeon este administrat de {legal.company.name}.</p>
        <CompanyDetails />
      </section>
      <section>
        <h2>1. Cookie-uri și stocare în browser</h2>
        <p>
          Cookie-urile sunt informații salvate de un site în browser. Local
          storage și session storage sunt mecanisme similare de stocare pe
          dispozitiv. Makeon nu are selector de limbă și nu stochează o
          preferință de limbă.
        </p>
      </section>
      <section>
        <h2>2. Ce folosește site-ul</h2>
        <div className="legal-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Informație</th>
                <th>Scop</th>
                <th>Durată</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Coșul — <code>makeon-coffee-cart-v1</code>
                </td>
                <td>
                  Produse, măcinare și cantități păstrate în local storage
                  pentru continuarea cumpărăturilor.
                </td>
                <td>Până la ștergerea coșului sau a datelor browserului.</td>
              </tr>
              <tr>
                <td>
                  Plata — <code>makeon-checkout-cart</code>,{" "}
                  <code>makeon-checkout-key</code>
                </td>
                <td>
                  Session storage pentru asocierea rezultatului plății cu
                  selecția din coș.
                </td>
                <td>
                  Pe durata sesiunii filei; sunt eliminate de fluxul de
                  confirmare/anulare atunci când este procesat.
                </td>
              </tr>
              <tr>
                <td>Autentificarea dashboardului</td>
                <td>
                  Cookie tehnic Payload pentru sesiunea administratorului și
                  eventuale preferințe tehnice ale interfeței.
                </td>
                <td>
                  Conform valabilității sesiunii și până la deconectare ori
                  ștergere, după caz.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Coșul nu conține numele, telefonul, e-mailul sau datele cardului.
          Selecția este transmisă serverului când plasezi o comandă. În prezent,
          aplicația nu include instrumente de analiză, pixeli de marketing sau
          cookie-uri publicitare.
        </p>
      </section>
      <section>
        <h2>3. Furnizorii externi</h2>
        <p>
          Stripe poate folosi propriile cookie-uri și mecanisme tehnice în
          pagina de plată, conform politicii sale. Găzduirea și serviciile de
          securitate pot procesa informații tehnice necesare funcționării.
          Politicile furnizorilor și configurația efectivă trebuie verificate
          înainte de lansare.
        </p>
      </section>
      <section>
        <h2>4. Controlul datelor și modificări</h2>
        <p>
          Poți șterge cookie-urile și stocarea acestui site din setările
          browserului. Selecția din coș și sesiunile de autentificare pot fi
          pierdute. Dacă introducem instrumente care necesită consimțământ, vom
          actualiza informarea și vom solicita acordul înainte de activarea lor.
        </p>
      </section>
      <section>
        <h2>5. Contact</h2>
        <LegalContact />
      </section>
    </LegalDocument>
  );
}
