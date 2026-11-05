import type { Metadata } from "next";
import LegalDocument, {
  CompanyDetails,
  LegalContact,
} from "@/components/legal-document";
import { legal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata(legal.terms, "Termeni și condiții | Makeon", "Informații despre comenzile Makeon: produse, prețuri, metode de plată, livrare și condițiile comerciale prezentate pe site."),
  robots: legal.draft ? { index: false, follow: true } : undefined,
};

export default function TermsPage() {
  return (
    <LegalDocument title="Termeni și condiții">
      <section>
        <h2>1. Domeniul de aplicare</h2>
        <p>
          Acești termeni reglementează comenzile de cafea și solicitările pentru
          echipamente, apă și servicii prezentate pe site-ul Makeon. Înainte de
          comandă, clientul poate consulta termenii și informațiile despre
          prelucrarea datelor.
        </p>
      </section>
      <section>
        <h2>2. Comerciantul</h2>
        <p>
          Makeon este denumirea comercială folosită pe acest site. Identitatea
          juridică a vânzătorului se completează mai jos.
        </p>
        <CompanyDetails />
        <LegalContact />
      </section>
      <section>
        <h2>3. Produse și servicii</h2>
        <p>
          Oferta include cafea, espressoare și soluții de filtrare, consultanță,
          instalare și mentenanță. Descrierea, gramajul, formatul și prețul
          disponibile se afișează în pagina produsului. Unele ilustrații sunt
          reprezentări ale produselor. Actualizarea catalogului nu modifică
          automat o comandă deja confirmată.
        </p>
      </section>
      <section>
        <h2>4. Comenzi din stoc și comenzi la cerere</h2>
        <p>
          Produsele cu preț confirmat și stoc disponibil pot fi comandate cu
          plata online cu cardul sau ramburs la livrare. Pentru card, stocul
          este rezervat temporar în timpul plății. Pentru ramburs, produsele
          sunt alocate la înregistrarea comenzii. Pentru livrare folosim
          adresa completată la finalizarea comenzii.
        </p>
        <p>
          Produsele fără stoc sau fără preț confirmat pot fi solicitate la
          cerere. Dacă un coș include un astfel de produs, întreaga comandă se
          discută telefonic. Înregistrarea solicitării nu presupune plată
          imediată. După confirmarea produselor, totalului și termenului,
          clientul plătește cu cardul prin linkul primit sau alege ramburs,
          conform opțiunii înregistrate. Pregătirea începe după plata cu cardul
          confirmată sau după confirmarea comenzii ramburs.
        </p>
        <p>
          Solicitările pentru echipamente și servicii se confirmă individual.
          Dacă există indisponibilități sau erori evidente, clientul este
          contactat pentru soluționare; o eventuală anulare a unei comenzi
          plătite implică restituirea sumelor datorate potrivit legii.
        </p>
      </section>
      <section>
        <h2>5. Prețuri și plată</h2>
        <p>
          Prețurile afișate și sumele de plată sunt în lei. Totalul produselor
          și transportul sunt prezentate înainte de plata directă. Pentru
          comenzile la cerere, prețurile și transportul sunt stabilite în
          discuția cu clientul înainte de emiterea linkului de plată. Plata cu
          cardul este procesată de Stripe; Makeon nu stochează numărul complet
          al cardului sau codul de securitate. La alegerea plății ramburs,
          totalul produselor și al transportului se achită la livrare.
          Pentru facturare pe persoană juridică, clientul completează denumirea
          firmei, CUI / CIF și adresa sediului social.
        </p>
      </section>
      <section>
        <h2>6. Livrare și instalare</h2>
        <p>
          Livrarea comenzilor online este disponibilă în România. Termenul
          estimat, curierul și condițiile de transport trebuie confirmate în
          oferta comercială înainte de lansare. Pentru producție la cerere,
          instalare sau mentenanță, termenul și locația se stabilesc individual
          înainte de plată.
        </p>
      </section>
      <section id="retragere">
        <h2>7. Retragere, retur și neconformități</h2>
        <p>
          Consumatorii beneficiază, în situațiile prevăzute de OUG nr. 34/2014,
          de un termen de 14 zile de la primirea bunurilor pentru a comunica
          retragerea, fără justificarea deciziei. Notificarea poate fi transmisă
          printr-o declarație clară la adresa de e-mail de contact, cu
          identificarea comenzii. Adresa și procedura operațională de retur
          trebuie completate înainte de lansare.
        </p>
        <p>
          Excepțiile legale se aplică numai când condițiile lor sunt
          îndeplinite, inclusiv pentru bunuri clar personalizate sau care se pot
          deteriora ori expira rapid. Simplul fapt că o cafea este aliment sau
          este pregătită după comandă nu exclude automat dreptul de retragere.
        </p>
        <p>
          Bunurile se returnează în termenul legal de la notificare. Rambursarea
          și eventualele costuri de retur se stabilesc conform legii și
          informațiilor comunicate înainte de comandă. Pentru produse
          deteriorate, greșite sau neconforme, contactează-ne; drepturile legale
          ale consumatorului rămân aplicabile.
        </p>
      </section>
      <section>
        <h2>8. Echipamente și garanții</h2>
        <p>
          Echipamentele beneficiază de drepturile legale privind conformitatea
          și, dacă este oferită, de garanția comercială descrisă în documentele
          produsului. O garanție comercială nu înlocuiește drepturile legale.
          Mentenanța și consumabilele sunt incluse numai în condițiile ofertei
          acceptate.
        </p>
      </section>
      <section>
        <h2>9. Conținut și răspundere</h2>
        <p>
          Textele, siglele, imaginile și elementele vizuale aparțin titularilor
          lor sau sunt utilizate cu drepturile corespunzătoare. Reproducerea
          necesită acordul titularului. Corectăm erorile semnalate pe site;
          acești termeni nu limitează drepturi sau răspunderi care nu pot fi
          excluse prin lege.
        </p>
      </section>
      <section>
        <h2>10. Soluționarea litigiilor</h2>
        <p>
          Încearcă mai întâi să ne contactezi pentru soluționarea unei
          nemulțumiri. Consumatorii pot consulta{" "}
          <a href={legal.anpc} target="_blank" rel="noopener noreferrer">
            ANPC
          </a>{" "}
          sau pot utiliza platforma națională{" "}
          <a href={legal.sal} target="_blank" rel="noopener noreferrer">
            SAL
          </a>
          . Aceste opțiuni nu afectează accesul la instanță.
        </p>
      </section>
      <section>
        <h2>11. Actualizări și contact</h2>
        <p>
          Comenzii i se aplică versiunea termenilor acceptată la plasare.
          Publicarea unei versiuni noi nu schimbă retroactiv condițiile unei
          comenzi existente.
        </p>
        <LegalContact />
      </section>
    </LegalDocument>
  );
}
