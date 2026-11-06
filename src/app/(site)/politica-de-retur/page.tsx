import LegalDocument, { CompanyDetails } from "@/components/legal-document";
import ReturnPolicy from "@/components/return-policy";
import { legal } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(legal.returns, "Retur și rambursare | Makeon", "Dreptul de retragere, termenele, adresa de retur, costurile și rambursarea pentru comenzile Makeon, conform legislației române pentru consumatori.");

export default function ReturnsPage() {
  return <LegalDocument title="Retur și rambursare">
    <section><h2>Comerciantul și adresa de retur</h2><CompanyDetails /></section>
    <section><h2>Condițiile de retragere și retur</h2><ReturnPolicy /></section>
  </LegalDocument>;
}
