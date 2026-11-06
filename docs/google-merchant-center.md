# Produse Makeon în Google — Merchant Center

Implementare: 6 noiembrie 2026. Feed public: `https://makeon.ro/google-merchant.xml`.

## Ce este pregătit în site

- RSS 2.0 cu namespace Google, generat din produsele active din CMS. Include ID stabil bazat pe slug, titlu, descriere, link canonical, imagine originală, preț RON cu TVA, disponibilitate, marcă și identificatori reali dacă sunt completați.
- Prețurile și stocurile vin din aceleași date ca magazinul. Produsele fără preț, fotografie sau stoc cunoscut nu sunt exportate. Nu se publică prețuri zero ca înlocuitor pentru „la cerere”.
- Produsele cu stoc zero rămân în feed ca `out_of_stock`, în acord cu `OutOfStock` din schema paginii. O cerere cu confirmare telefonică nu este o achiziție imediată din stoc. Nu se publică `backorder` și date de reaprovizionare inventate.
- Transportul declarat în feed este tariful configurat `SHIPPING_PRICE_BANI` pentru Sameday la adresă, în România. Costul este inclus și în datele structurate ale produsului când configurația este validă. Nu au fost inventate termene de livrare sau condiții de retur.
- Gramajul cunoscut este trimis și ca măsură pentru prețul unitar în kg. Accesoriile folosesc unitatea lor de ambalare.
- Ruta răspunde XML, fără autentificare, fără cache de prețuri/stocuri și cu `X-Robots-Tag: noindex`. Nu este blocată de robots.txt; feedul se adaugă în Merchant Center, nu în sitemap-ul Search Console.
- Paginile individuale păstrează `Product` / `Offer`, prețul, valuta, imaginea originală, marca, SKU, GTIN/MPN dacă există și datele de transport. Nu conțin evaluări sau coduri de identificare inventate.

## Ce s-a verificat în catalog

La verificarea din 6 noiembrie: 11 produse active, toate cu preț și imagine originală accesibilă (PNG, 1024 × 1536 sau 1254 × 1254). Un produs avea stoc disponibil și 10 erau la cerere. Toate cele 11 intrau în feed, cu disponibilitatea corespunzătoare. Numerele se schimbă odată cu actualizările din admin.

Niciunul dintre cele 11 produse nu avea încă GTIN completat. Aceasta înseamnă informație necunoscută, nu confirmarea că produsul nu are un cod de bare. Feedul omite identificatorul până la completare; Merchant Center poate cere aceste date sau poate limita aprobarea/afișarea până la clarificare.

## Câmpurile din admin

În **Produse → produs → Google / Merchant Center**:

- **Include în feedul Google**: permite retragerea din feed fără ascunderea produsului din magazin.
- **Marca produsului**: marca reală de pe ambalaj. Pentru cafele, câmpul gol folosește SwitchMORN Coffee. Pentru accesorii nu se presupune automat o marcă.
- **EAN / GTIN**: codul real al ambalajului, ca text, cu zerourile de la început păstrate. Sunt verificate lungimile de 8, 12, 13 sau 14 cifre și cifra de control; validarea nu dovedește înregistrarea GS1 sau apartenența la acel produs.
- **MPN**: numai codul atribuit de producător. Nu este generat din slug sau dintr-un SKU intern.
- **Producătorul confirmă că produsul nu are GTIN / MPN**: se bifează doar după confirmare. Nu poate fi bifat simultan cu un GTIN/MPN completat. Doar această confirmare explicită produce `identifier_exists=no`.

Schema este adăugată prin migrarea `20261106_120000_google_product_identifiers`. Migrarea adaugă cinci coloane opționale și nu modifică prețurile, stocurile sau comenzile. A fost aplicată bazei configurate și s-a confirmat că toate cele 18 rânduri existente de produs au rămas identice pe coloanele anterioare. Pe alte baze, rulează `npm run cms:migrate` înainte de publicarea codului nou. Rollback-ul este blocat dacă ar elimina identificatori completați.

## Configurarea în contul Google

1. Deschide [Google Merchant Center](https://merchants.google.com/) și creează/selectează contul comerciantului. Completează identitatea și contactele reale ale firmei.
2. Verifică și revendică website-ul `https://makeon.ro` conform opțiunilor din cont. Proprietatea Search Console existentă este distinctă de configurarea contului Merchant Center.
3. Activează **listările gratuite**. Configurarea de aici nu creează o campanie Google Ads și nu presupune un buget de reclamă.
4. În **Setări → Surse de date → Adaugă sursă de produse**, alege **Adaugă produse dintr-un fișier**, apoi introdu `https://makeon.ro/google-merchant.xml`. Alege România și limba română, dacă interfața solicită aceste opțiuni.
5. Configurează preluare zilnică și pornește prima preluare. Nu introduce user/parolă: feedul conține numai date publice de produs. Modificările sunt disponibile imediat la URL; Google le vede la următoarea preluare sau prin mecanismele sale de actualizare.
6. Verifică transportul și politica de retur în Merchant Center. Feedul declară tariful actual de curier la adresă; alte servicii, termenele și condițiile finale se completează conform contractului real. Verifică alinierea cu checkout-ul după orice schimbare a tarifului.
7. În diagnosticul produselor, rezolvă identificatorii lipsă, problemele de imagine, preț sau disponibilitate. Verifică pagini reprezentative în [Rich Results Test](https://search.google.com/test/rich-results).

## Date care mai necesită confirmarea proprietarului

Identitatea comerciantului a fost confirmată de proprietar: VENDING STORE IMPEX SRL, CUI 30702112, J40/10880/2012, cu sediul în Str. Sg. Maj. Ilie Ancuta nr. 3-9, Sectorul 4, București, cod poștal 040556. Datele sunt completate în toate politicile. Configurația legală rămâne `draft` până la confirmarea condițiilor finale de livrare/retur și a procedurilor de prelucrare a datelor. Nu este suficient un feed valid pentru aprobarea contului sau produselor.

Verifică EAN/GTIN pe fiecare ambalaj și completează identificatorii reali. Nu copia un cod între gramaje sau produse diferite. Dacă există o excepție legitimă pentru produse fără identificatori, confirm-o înainte să o declari în admin.

Feedul și marcajul fac datele eligibile pentru procesare. Google decide aprobarea și afișarea în rezultate; apariția și poziția nu sunt garantate. Stocul disponibil pentru comandă imediată trebuie actualizat numai pe baza inventarului real.

Surse: [specificația datelor de produs](https://support.google.com/merchants/answer/7052112), [import din fișier](https://support.google.com/merchants/answer/12158380), [preluare programată](https://support.google.com/merchants/answer/14991445), [date structurate Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing), [cerințele checkout-ului](https://support.google.com/merchants/answer/9158778).
