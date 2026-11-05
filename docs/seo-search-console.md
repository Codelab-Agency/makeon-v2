# SEO, GEO și Search Console — Makeon

Audit și implementare: 5 noiembrie 2026. Domeniu canonical: `https://makeon.ro`.

## Ce a arătat auditul inițial

| Verificare pe site-ul public | Înainte | Implementare |
| --- | --- | --- |
| `robots.txt` | 404 | Reguli pentru pagini publice și sitemap; admin/API/checkout excluse de la crawling |
| `sitemap.xml` | 404 | Dinamic, cu paginile comerciale și produsele active din CMS |
| Canonical | Lipsea pe pagini și produse | URL propriu pentru fiecare pagină, pe domeniul fără www |
| www / fără www | Ambele variante răspundeau 200 | Redirect permanent pentru paginile publice HTML; rutele API, Stripe și admin nu sunt redirecționate |
| Magazin fără JavaScript | Nicio legătură HTML către produse | Carduri, nume, prețuri și linkuri randate pe server; cumpărarea așteaptă validarea catalogului live |
| Date structurate | Lipseau | Organization, WebSite, Service, CollectionPage, ItemList, Product și BreadcrumbList, după tipul paginii |
| Partajare | Fără setări dedicate | Open Graph, Twitter și imagine Makeon 1200 × 630; produsele folosesc imaginea proprie |
| Titluri de produs | Gramajul putea deveni `null g` la accesorii | Denumire și ambalaj/unitate corecte; descrieri normalizate și limitate pentru snippet |
| Proprietate Google | Neconfigurată | Token primit de la proprietar, confirmat în DNS public și inclus ca meta tag alternativ |

Sitemap-ul folosește `updatedAt` real pentru produse. Paginile statice nu primesc o dată artificială la fiecare accesare. Când CMS-ul configurat nu răspunde, sitemap-ul nu este înlocuit cu o listă statică de produse sau prețuri vechi.

## Google Search Console: pașii din contul proprietarului

1. Deschide [Search Console](https://search.google.com/search-console/welcome), adaugă proprietatea **Domeniu** `makeon.ro` și apasă **Verifică**. Înregistrarea TXT din [search-console-dns.txt](./search-console-dns.txt) este deja vizibilă în DNS. Păstreaz-o în DNS după verificare. Proprietatea Domeniu acoperă și www.
2. După publicarea codului, verifică faptul că `https://makeon.ro/robots.txt` și `https://makeon.ro/sitemap.xml` răspund 200.
3. În **Sitemaps**, trimite `https://makeon.ro/sitemap.xml`. Confirmă statusul de preluare; sitemap-ul ajută descoperirea, dar nu garantează indexarea.
4. În **Inspectarea adresei URL**, verifică pe rând `/`, `/cafea-pentru-birouri`, `/apa`, `/prajitoria`, `/cafea`, `/cafea-la-evenimente` și cel puțin un produs. Rulează testul live și solicită indexarea pentru paginile importante.
5. Urmărește rapoartele **Indexarea paginilor**, **Sitemaps**, **Performanță** și **Core Web Vitals**. Numărul de produse poate varia odată cu activarea/dezactivarea lor în CMS.
6. Verifică o pagină de produs în [Rich Results Test](https://search.google.com/test/rich-results) și graful general în [Schema Markup Validator](https://validator.schema.org/).

Prezența TXT-ului nu confirmă că proprietarul a apăsat Verifică. Nu avem acces la contul Google, iar publicarea codului nu trimite automat sitemap-ul în acel cont. Nu se folosește Indexing API pentru indexarea obișnuită a acestor pagini.

## GEO și acces pentru instrumente AI

Conținutul esențial rămâne disponibil în HTML: servicii, întrebări/răspunsuri existente, contact, catalog și pagini individuale de produs. Entitatea Makeon este legată consecvent de SwitchMORN Coffee și Vero Aqua. Marcajul descrie informațiile afișate pe site; nu include recenzii, coordonate, adrese de sediu, stocuri sau prețuri inventate.

Regula publică `User-agent: *` permite accesul crawlerelor de căutare, inclusiv OAI-SearchBot. Nu am introdus reguli separate care ar ocoli restricțiile pentru admin/API/checkout. Politica de acces a boților de antrenare nu a fost modificată separat. Firewall-ul furnizorului trebuie să permită la rândul lui crawlerii legitimi; `robots.txt` nu înlocuiește autentificarea.

`/llms.txt` este un rezumat opțional de navigare către sursele oficiale. Nu conține o copie a prețurilor și stocurilor care s-ar putea învechi. Nu este o condiție Google și nu garantează apariția în răspunsuri AI. Google recomandă aceleași baze SEO pentru funcțiile AI; nu există un marcaj special obligatoriu pentru GEO.

## Ce rămâne editorial și comercial

- `legal.draft` este încă `true`, iar datele juridice ale comerciantului sunt necompletate. Politicile rămân `noindex` și lipsesc din sitemap până la finalizarea și aprobarea lor; apoi se actualizează configurația legală și se republică site-ul.
- Pentru o prezență locală, trebuie confirmate adresa reală, programul și aria de lucru. Nu au fost inventate un sediu sau coordonate pentru schema LocalBusiness.
- Recenziile și logo-urile clienților se pot adăuga după primirea conținutului real și a dreptului de utilizare. Nu au fost generate evaluări artificiale.
- Un scor de viteză sau un raport Core Web Vitals necesită măsurători reale; verificările de metadate nu reprezintă un audit Lighthouse și nu garantează poziții în căutare.

## Verificare tehnică

`npm run typecheck`, testele din `tests/commerce/seo.test.ts` și `npx playwright test tests/seo.spec.ts` verifică metadatele, datele structurate, protecția la injectare în JSON-LD, renderingul fără JavaScript, sitemap-ul, excluderile și păstrarea validării live înainte de cumpărare. Verificările de comerț existente acoperă în continuare cardul, rambursul și easybox.

Surse: [Google: funcții AI și site-ul tău](https://developers.google.com/search/docs/appearance/ai-features), [Google: sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google: verificarea proprietății](https://support.google.com/webmasters/answer/9008080), [OpenAI: crawlere](https://developers.openai.com/api/docs/bots).
