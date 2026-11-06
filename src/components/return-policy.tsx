import { legal } from "@/lib/legal";

/** Same consumer rights and operational instructions on the terms and return pages. */
export default function ReturnPolicy() {
  return <>
    <h3>Cine beneficiază de retragere</h3>
    <p>Dreptul legal de retragere se aplică persoanelor fizice care cumpără în afara activității profesionale, în condițiile OUG nr. 34/2014. Achizițiile pentru activitatea profesională nu beneficiază automat de acest drept.</p>
    <h3>Cum ne anunți</h3>
    <p>Poți comunica retragerea, fără motivare, în 14 zile calendaristice de când tu sau persoana desemnată primește bunurile. Pentru produse din aceeași comandă livrate separat, termenul începe la primirea ultimului produs. Trimite o declarație neechivocă la <a href={`mailto:${legal.email}`}>{legal.email}</a> sau prin poștă la sediul de mai jos. Indică produsele și datele care permit identificarea comenzii. Este suficient să transmiți notificarea înainte de expirarea termenului; nu trebuie să aștepți aprobarea noastră.</p>
    <h3>Unde și când trimiți bunurile</h3>
    <p>Expediază bunurile fără întârziere nejustificată, în cel mult 14 zile de la notificare, către <strong>{legal.company.name}, {legal.company.address}</strong>. Termenul este respectat dacă le expediezi înainte de expirare. Ambalează-le pentru transport și păstrează dovada expedierii.</p>
    <h3>Costul returului</h3>
    <p>Pentru retragerea dintr-o cumpărare conformă, suporți costul direct al returnării, achitat transportatorului ales, dacă nu convenim să îl suportăm noi. Nu percepem o taxă administrativă de retragere. Regula nu înlătură situațiile în care legea pune costurile în sarcina comerciantului, inclusiv lipsa informării prealabile despre costul returului.</p>
    <h3>Rambursarea</h3>
    <p>Restituim sumele datorate fără întârziere nejustificată, în cel mult 14 zile de la notificare. La retragerea din întreaga comandă, restituim și costul livrării inițiale, până la valoarea celei mai ieftine livrări standard oferite; suplimentul pentru o livrare mai scumpă aleasă expres nu se restituie. Putem aștepta primirea bunurilor sau a dovezii expedierii, luând în calcul primul eveniment, dacă nu ne-am oferit să le recuperăm noi. Folosim metoda inițială de plată, cu excepția unei alte metode acceptate expres de tine, fără comisioane de rambursare.</p>
    <h3>Starea produselor și excepțiile</h3>
    <p>Poate fi luată în calcul numai diminuarea demonstrabilă a valorii produsă prin manipulări peste cele necesare verificării naturii, caracteristicilor și funcționării bunului, în condițiile legii. Excepțiile de la retragere se aplică doar dacă sunt îndeplinite cerințele art. 16: de exemplu, bunuri clar personalizate, bunuri care se deteriorează ori expiră rapid sau bunuri sigilate care nu pot fi returnate din motive de sănătate/igienă și au fost desigilate. Cafeaua și produsele pregătite la cerere nu sunt excluse automat.</p>
    <h3>Produse greșite, deteriorate sau neconforme</h3>
    <p>Contactează-ne la <a href={`mailto:${legal.email}`}>{legal.email}</a> sau <a href={legal.phoneHref}>{legal.phone}</a>. Reclamațiile de neconformitate sunt distincte de retragere: remediile și transportul necesar se acordă fără costuri pentru consumator în cazurile prevăzute de OUG nr. 140/2021. Drepturile obligatorii prevăzute de lege rămân aplicabile.</p>
    <h3>Contracte de servicii</h3>
    <p>Pentru servicii, termenul legal de retragere curge de la încheierea contractului. Începerea executării în acest interval necesită cererea expresă a consumatorului; la retragere se pot datora prestațiile efectuate în condițiile legii. Pierderea dreptului după executarea integrală presupune acordurile prevăzute de lege.</p>
    <h3>Model opțional de notificare</h3>
    <p>Poți copia și completa modelul de mai jos sau poți folosi orice altă declarație neechivocă:</p>
    <blockquote className="withdrawal-model">
      <p>Către {legal.company.name}, {legal.company.address}, {legal.email}</p>
      <p>Vă informez/Vă informăm că mă retrag/ne retragem din contractul privind vânzarea următoarelor bunuri: [produsele].</p>
      <p>Comandate la / primite la: [data]. Referința comenzii, dacă este disponibilă: [referința].</p>
      <p>Numele consumatorului/consumatorilor: [numele].<br />Adresa consumatorului/consumatorilor: [adresa].<br />Data: [data].<br />Semnătura consumatorului/consumatorilor: [numai dacă notificarea este pe hârtie].</p>
      <p>Șterge opțiunile care nu se aplică.</p>
    </blockquote>
    <p>Temeiuri legale: <a href="https://legislatie.just.ro/Public/DetaliiDocument/158913" target="_blank" rel="noopener noreferrer">OUG nr. 34/2014, art. 9–16 și anexa nr. 1</a> și <a href="https://legislatie.just.ro/Public/DetaliiDocument/250044" target="_blank" rel="noopener noreferrer">OUG nr. 140/2021</a>.</p>
  </>;
}
