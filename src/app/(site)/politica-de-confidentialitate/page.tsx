import type { Metadata } from "next";
import LegalDocument, {
  CompanyDetails,
  LegalContact,
} from "@/components/legal-document";
import { legal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata(legal.privacy, "Politica de confidențialitate | Makeon", "Informații despre datele personale prelucrate prin site-ul Makeon, scopurile prelucrării, destinatarii datelor și modalitățile de contact."),
  robots: legal.draft ? { index: false, follow: true } : undefined,
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Politica de confidențialitate">
      <section>
        <h2>1. Cine folosește datele</h2>
        <p>
          {legal.company.name}, comerciantul care operează Makeon, este
          responsabil pentru datele folosite la gestionarea comenzilor și
          solicitărilor. Datele sale de identificare sunt prezentate mai jos.
        </p>
        <CompanyDetails />
        <LegalContact />
      </section>
      <section>
        <h2>2. Ce date colectăm</h2>
        <p>
          Pentru o comandă la cerere colectăm numele, e-mailul, telefonul,
          produsele și cantitățile și, dacă alegi să îl completezi, mesajul tău.
          După plata prin Stripe, comanda poate include și adresa de livrare,
          totalul și identificatorii tranzacției. Păstrăm versiunea termenilor
          acceptați și momentul acceptării.
        </p>
        <p>
          Formularul de ofertă include numele, e-mailul, soluția dorită și
          dimensiunea echipei; compania, telefonul și mesajul sunt opționale.
          Solicitarea este transmisă prin e-mail. Serviciile tehnice pot procesa
          adresa IP și jurnale pentru securitate și funcționare. Nu introduce
          date sensibile în câmpurile de mesaj.
        </p>
        <p>
          Datele cardului sunt introduse în pagina Stripe. Site-ul nostru nu
          stochează numărul complet al cardului sau codul de securitate.
        </p>
      </section>
      <section>
        <h2>3. De ce le folosim</h2>
        <p>
          Folosim datele pentru a răspunde solicitărilor, a confirma telefonic
          ofertele, a procesa plata și livrarea și a gestiona comenzile. Temeiul
          este executarea contractului sau demersurile cerute înainte de
          încheierea lui. Pentru evidențele impuse de lege, temeiul este
          obligația legală; pentru protejarea site-ului și prevenirea
          abuzurilor, interesul legitim.
        </p>
        <p>
          Nu condiționăm comanda de acceptarea mesajelor publicitare și nu avem
          în prezent abonare la marketing pe acest site.
        </p>
      </section>
      <section>
        <h2>4. Cine poate primi datele</h2>
        <p>
          Datele necesare pot fi accesate de personalul autorizat și de
          furnizorii folosiți pentru găzduire (Vercel), baza de date (Neon),
          fișiere (Cloudflare R2), plăți (Stripe) și e-mail (Resend). Pentru
          executarea comenzii pot fi comunicate curierului și, când este
          necesar, furnizorilor de contabilitate ori autorităților competente.
        </p>
        <p>
          Unii furnizori pot prelucra date în afara Spațiului Economic European.
          Condițiile și garanțiile transferurilor trebuie confirmate în
          acordurile cu aceștia înainte de lansare. Pentru detalii despre
          destinatarii și garanțiile aplicabile, ne poți contacta.
        </p>
      </section>
      <section>
        <h2>5. Cât timp le păstrăm</h2>
        <p>
          Păstrăm datele cât este necesar pentru soluționarea solicitării și
          executarea comenzii, apoi pentru obligațiile legale de evidență,
          garanții și eventuale litigii. Durata depinde de tipul documentului și
          de obligația aplicabilă. Termenele interne și procedura de ștergere
          trebuie stabilite înainte de lansare; site-ul nu șterge automat
          comenzile după un termen fix.
        </p>
      </section>
      <section>
        <h2>6. Drepturile tale</h2>
        <p>
          În condițiile GDPR, poți solicita accesul la date, corectarea,
          ștergerea, restricționarea, portabilitatea sau te poți opune anumitor
          prelucrări. Unele date trebuie păstrate pentru obligații legale. Dacă
          o prelucrare se bazează pe consimțământ, îl poți retrage pentru
          viitor.
        </p>
        <LegalContact />
        <p>
          Poți depune o plângere la{" "}
          <a
            href="https://www.dataprotection.ro/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Autoritatea Națională de Supraveghere a Prelucrării Datelor cu
            Caracter Personal
          </a>
          . Nu folosim un sistem automat de profilare care să decidă asupra
          comenzii tale; furnizorul de plăți poate aplica propriile verificări
          de securitate.
        </p>
      </section>
    </LegalDocument>
  );
}
