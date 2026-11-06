import ShopShell from "./shop-shell";
import { legal } from "@/lib/legal";

export function CompanyDetails() {
  const { company } = legal;
  return (
    <dl className="legal-company">
      <div>
        <dt>Denumire legală</dt>
        <dd>{company.name || "De completat înainte de lansare"}</dd>
      </div>
      <div>
        <dt>CUI / CIF</dt>
        <dd>{company.cui || "De completat"}</dd>
      </div>
      <div>
        <dt>Registrul Comerțului</dt>
        <dd>{company.registration || "De completat"}</dd>
      </div>
      <div>
        <dt>Sediu</dt>
        <dd>{company.address || "De completat"}</dd>
      </div>
    </dl>
  );
}

export function LegalContact() {
  return (
    <p>
      Ne poți contacta la <a href={`mailto:${legal.email}`}>{legal.email}</a>{" "}
      sau la <a href={legal.phoneHref}>{legal.phone}</a>.
    </p>
  );
}

export default function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ShopShell>
      <article className="legal-document">
        <span className="eyebrow">Informații legale</span>
        <h1>{title}</h1>
        <p className="legal-updated">Ultima actualizare: {legal.updated}</p>
        {legal.draft && (
          <aside className="legal-draft">
            Versiune de lucru. Condițiile comerciale și procedurile de
            prelucrare a datelor sunt în curs de confirmare.
          </aside>
        )}
        {children}
      </article>
    </ShopShell>
  );
}
