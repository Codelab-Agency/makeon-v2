# Makeon — Ghid de administrare a magazinului

Acest ghid explică folosirea dashboardului pentru gestionarea produselor, imaginilor, stocului și comenzilor. Configurarea tehnică este realizată la predarea site-ului.

## Accesul în dashboard

1. Deschide adresa site-ului urmată de `/admin`, de exemplu `https://makeon.ro/admin`.
2. Autentifică-te cu adresa de e-mail și parola primite la predare.
3. Folosește meniul pentru a deschide **Produse**, **Imagini**, **Comenzi** sau **Administratori**.

Pe telefon, deschide meniul din butonul din colț. Tabelele pot fi glisate orizontal pentru a vedea coloanele din dreapta. Poți folosi căutarea și filtrele pentru a găsi un produs sau o comandă.

Păstrează datele de acces private. Dacă ai uitat parola, contactează echipa care întreține site-ul; recuperarea automată prin e-mail nu este configurată în prezent.

## Adăugarea unui produs

1. Deschide **Produse** și apasă **Creați unul nou** sau **Adaugă produs** pe pagina principală.
2. Completează numele și identificatorul `slug`. Acesta apare în adresa produsului: de exemplu, `costa-rica`. Folosește litere mici, cifre și cratime, fără spații sau diacritice. Identificatorul trebuie să fie unic.
3. Alege categoria: **Boabe**, **Măcinată**, **Solubilă**, **Alternative**, **Decaff** sau **Complementare**. Pentru Decaff, alege și formatul: boabe sau măcinată.
4. Pentru cafea, completează colecția, gramajul și descrierea. Gramajul se introduce în grame: `250`, `500` sau `1000` pentru 1 kg. Pentru Complementare, completează în schimb **Unitate / ambalaj**, de exemplu „1 ceașcă”, „set de 6” sau „cutie de 100 buc.”; câmpurile de cafea sunt ascunse.
5. Completează prețul și stocul, apoi selectează imaginea.
6. Adaugă, dacă sunt disponibile, notele de degustare, originea, altitudinea, varietatea, procesarea și prăjirea.
7. Bifează **Vizibil în magazin** pentru publicare și apasă **Salvează**.
8. Deschide magazinul și verifică pagina produsului, imaginea, prețul și gramajul sau unitatea de vânzare. Pentru accesoriile complementare, prețul și stocul se referă la unitatea / ambalajul introdus.

Dacă produsul nu este încă pregătit pentru publicare, lasă **Vizibil în magazin** debifat. Modificarea identificatorului unui produs deja publicat schimbă adresa paginii; discută cu echipa tehnică înainte de a-l schimba.

## Prețurile și stocul

Pentru a șterge un produs adăugat din greșeală, deschide produsul și alege **Șterge** din meniul de acțiuni. Ștergerea este permisă doar administratorilor și doar dacă produsul nu apare în comenzi și nu are plăți în curs. Pentru produsele cu istoric, debifează **Vizibil în magazin** și salvează. Imaginea rămâne în bibliotecă și poate fi reutilizată.

**Prețul produsului se introduce în lei**, cu maximum două zecimale. Pentru un preț de 45,50 lei, introdu `45.50`, nu `4550`. Dacă lași prețul gol, magazinul afișează **Preț la cerere**, iar produsul nu poate fi plătit online.

**Stoc fizic (unități / ambalaje)** reprezintă numărul total de unități de vânzare existente, inclusiv cele rezervate pentru plăți în curs. Pentru o cutie de 100 de bețișoare, stocul `5` înseamnă 5 cutii, nu 5 bețișoare. Când primești marfă, actualizează totalul fizic, nu doar cantitatea nouă.

**Rezervat pentru plăți în curs** este calculat automat și nu poate fi modificat manual. De exemplu, din 12 ambalaje fizice și 2 rezervate, magazinul afișează 10 disponibile. Nu poți seta stocul fizic sub cantitatea rezervată.

La o plată confirmată, stocul scade automat. Nu îl scădea încă o dată manual pentru aceeași comandă. O sesiune de plată are o rezervare de aproximativ 35 de minute. La anularea sau expirarea confirmată a sesiunii, rezervarea se eliberează; actualizarea poate apărea după procesarea confirmării sau reîncărcarea catalogului.

Pentru produsele din stoc plătite cu cardul, comanda se creează numai după confirmarea Stripe. Deschiderea checkout-ului salvează separat o rezervare tehnică, fără comandă și fără număr de comandă în administrare. Înapoi/anularea eliberează rezervarea după verificarea Stripe; închiderea tabului o lasă până la expirarea sesiunii. O plată confirmată se înregistrează și dacă clientul nu revine pe site. Comenzile ramburs și cele la cerere se înregistrează la trimiterea formularului.

La stoc disponibil zero, produsul rămâne vizibil și poate fi comandat **la cerere**. Clientul completează numele, telefonul și e-mailul, iar solicitarea apare în **Comenzi**, fără plată imediată. Dacă un coș conține atât produse din stoc, cât și produse la cerere, întreaga comandă se confirmă telefonic. Pentru a retrage complet un produs, debifează **Vizibil în magazin** și salvează.

Același formular de comandă la cerere este disponibil și la `/finalizare-comanda` pentru produse fără preț sau cu stoc insuficient. Se păstrează datele de contact, livrarea, facturarea și metoda de plată aleasă. Formularul funcționează fără Stripe configurat; Stripe este necesar ulterior pentru generarea linkului de plată cu cardul.

## Comenzile la cerere și linkul de plată

1. Deschide comanda marcată **La cerere / producție**, cu statusul plății **De confirmat telefonic**.
2. Contactează clientul folosind telefonul din comandă. Confirmă produsele, prețul, transportul și termenul de pregătire.
3. În panoul **Confirmare telefonică și plată**, completează prețul unitar al fiecărui produs și transportul în lei. Prețurile inițiale sunt estimative; produsele fără preț necesită completare.
4. Pentru card, apasă **Generează link de plată**. Copiază linkul și transmite-l clientului pe canalul agreat. Linkul nu este trimis automat prin e-mail.
5. Cât timp linkul este activ, prețurile sunt blocate și generările repetate folosesc același link. Valabilitatea este afișată în panou, aproximativ 23 de ore. După expirare, reîncarcă/verifică linkul, apoi generează unul nou.
6. După confirmarea Stripe, statusul plății devine **Plătită**. Poți trece comanda în **În pregătire** și începe producția.

Pentru ramburs, apasă **Confirmă comanda ramburs** după stabilirea prețurilor și transportului. Totalul se fixează și statusul devine **Ramburs de încasat**; nu se generează link Stripe.

Comenzile la cerere nu rezervă și nu scad stocul fizic existent, inclusiv pentru un coș mixt: reprezintă produse pregătite după confirmare. Nu le trata ca livrări automate din stoc. Pregătirea este permisă după plata cu cardul confirmată sau după confirmarea comenzii ramburs. Dacă generarea linkului întâmpină o eroare, reîncearcă fără a schimba prețurile; aceeași încercare este recuperată.

## Încărcarea fotografiilor

1. Deschide **Imagini** și creează o imagine nouă sau folosește câmpul de imagine din formularul produsului.
2. Selectează fotografia. Sunt acceptate JPG, PNG, WebP și AVIF, până la **3 MB**.
3. Completează **Descriere imagine**, de exemplu „Pungă de cafea Costa Rica, 250 g”.
4. Apasă **Salvează** în bara de sus a formularului sau a panoului deschis.
5. Selectează imaginea în produs și salvează și produsul.

Folosește fotografii clare și un fundal consecvent. Biblioteca de imagini este publică: încarcă doar fotografii de produs, fără documente sau date personale. Evită ștergerea imaginilor folosite de produse; înlocuiește mai întâi imaginea din produs.

## Vizualizarea și gestionarea comenzilor

Deschide **Comenzi** și selectează o comandă. Pagina afișează clientul, datele de contact, adresa de livrare, produsele, cantitățile, transportul și totalul în lei.

Există două statusuri diferite:

- **Status plată** este gestionat de sistem: De confirmat telefonic (comenzi la cerere), În așteptarea plății, Ramburs de încasat, Plătită, Anulată, Expirată sau Eșuată. Pentru ramburs există acțiuni dedicate de confirmare și anulare; câmpul nu se editează direct.
- **Status comandă** se modifică de tine: Nouă → În pregătire → Expediată → Livrată. Selectează etapa potrivită și apasă **Salvează**.

Pentru o comandă obișnuită:

1. Verifică dacă statusul plății este **Plătită** (card) sau **Ramburs de încasat** (ramburs).
2. Verifică produsele și adresa, apoi trece comanda în **În pregătire**.
3. După predarea coletului curierului, selectează **Expediată**.
4. După confirmarea livrării, selectează **Livrată**.

Pentru card, nu expedia o comandă înainte de confirmarea plății. Pentru ramburs, verifică totalul de încasat la livrare. Dacă plata pare neclară, verifică situația în contul Stripe și contactează echipa tehnică înainte de a cere clientului să plătească din nou.

La schimbarea statusului și salvare, clientul primește o notificare prin email. Resalvarea fără o schimbare de status nu trimite un nou mesaj. Secțiunea **Notificări client** arată rezultatul; dacă trimiterea nu a fost confirmată, folosește **Reîncearcă notificările**. „Trimis” înseamnă că serviciul de email a acceptat mesajul, nu că acesta a ajuns sigur în inbox. Dacă apare **Necesită verificare**, contactează echipa tehnică înainte de o nouă trimitere. Comenzile fără o adresă de email validă nu pot fi notificate.

Notificările trebuie activate prin configurarea expeditorului de email de către echipa tehnică. Până atunci, schimbarea statusului rămâne salvată și mesajele așteaptă reîncercarea.

Actualizarea statusului nu generează automat un AWB sau o factură. Rambursările se gestionează separat în Stripe; ele nu readuc automat produsele în stoc și nu sunt reflectate printr-un status de rambursare în acest dashboard. Pentru retururi, confirmă situația cu echipa tehnică și actualizează stocul fizic după recepția mărfii.

## AWB Sameday

În detaliul unei comenzi plătite sau confirmate cu ramburs, secțiunea **Livrare Sameday · AWB** permite emiterea unui AWB pentru un singur colet, cu livrare la adresă sau la easybox în România. Verifică numele, telefonul, adresa și județul (denumirea completă), apoi introdu greutatea coletului ambalat în kg. Punctul de ridicare și serviciile sunt încărcate din contul Sameday: 24H pentru adresă, Locker NextDay (`LN`) pentru easybox. Pentru card, AWB-ul are ramburs zero. Pentru ramburs, AWB-ul preia automat totalul produselor și transportului în lei. Nu sunt incluse livrările internaționale sau retururile.

### Harta și livrarea easybox

Pe lângă credențialele API de producție, completează în `.env` (și în mediul de producție):

```dotenv
SAMEDAY_LOCKER_CLIENT_ID=identificatorul-primit-de-la-sameday
SAMEDAY_LOCKER_API_USERNAME=utilizatorul-public-al-hartii
EASYBOX_SHIPPING_PRICE_BANI=1800
```

Ultima variabilă este opțională; exemplul înseamnă 18 lei. Dacă este goală, se folosește `SHIPPING_PRICE_BANI`. Repornește serverul după modificarea configurației. Cei doi identificatori ai hărții sunt publici și separați de parola API. Parola Sameday rămâne exclusiv pe server. Harta se încarcă la apăsarea butonului, conform [documentației oficiale](https://cdn.sameday.ro/locker-plugin/techdoc.html).

Opțiunea apare în checkout numai când toate credențialele sunt configurate și `SAMEDAY_ENV=production`: harta publică nu este folosită cu AWB-uri sandbox. Contul trebuie să aibă serviciul Locker NextDay activ. Nu se introduc manual ID-uri de servicii.

Dacă harta afișează **„Clientul nu a fost găsit”**, verifică împreună cu Sameday că `SAMEDAY_LOCKER_CLIENT_ID` este identificatorul emis pentru **Locker Plugin în producție**, asociat cu utilizatorul LM transmis în `SAMEDAY_LOCKER_API_USERNAME`. Un UUID cu format valid nu dovedește înregistrarea clientului. Nu folosi ID-ul numeric de client din eAWB, un UUID generat sau identificatorul din exemplul documentației. Cere Sameday confirmarea perechii de identificatori pentru plugin; nu trimite parola API. După corectarea valorilor, repornește serverul și reîncarcă pagina.

Clientul selectează lockerul pe hartă. Serverul verifică ID-ul și salvează denumirea și adresa confirmate de Sameday, separat de adresa de facturare. Sunt acceptate easyboxuri, fără puncte partenere PUDO. Pentru ramburs, lockerul trebuie să accepte plata la ridicare; altfel clientul alege alt locker sau card online. Aceeași selecție funcționează pentru comenzile la cerere; transportul final se confirmă telefonic împreună cu oferta.

În administrare, destinația easybox este preluată din comandă și nu se editează în formularul AWB. La emitere se verifică din nou lockerul și se transmite `lockerLastMile` cu serviciul corespunzător. Verifică înainte de expediere că ambalajul și greutatea respectă condițiile serviciului din contractul Sameday. Integrarea easybox nu necesită o migrare nouă: selecția se salvează în datele existente ale comenzii.

După emitere poți descărca eticheta PDF A4 sau A6. Statusul comenzii nu se schimbă automat; marchează expedierea când predai coletul. Anulările și solicitările de ridicare se gestionează în eAWB.

Dacă emiterea nu este confirmată, verifică referința comenzii în eAWB înainte să continui. Sistemul blochează o nouă emitere pentru a evita dublurile. Dacă găsești AWB-ul, folosește **Asociază AWB existent** (după minimum cinci minute pentru o cerere rămasă în curs). Verifică atent că numărul aparține comenzii respective. Dacă nu găsești nicio expediere, cere verificarea tehnică a încercării înainte de deblocare.

Configurare server: `SAMEDAY_ENV=production` (sau `sandbox`), `SAMEDAY_USERNAME`, `SAMEDAY_PASSWORD`. Credențialele de test sunt diferite de cele de producție. Nu se folosesc variabile `NEXT_PUBLIC_`. Rulează `npm run cms:migrate` înainte de publicare pentru migrarea `20261022_120000_sameday_shipments`, care adaugă doar tabelul `order_shipments`. Păstrează `PAYLOAD_DB_PUSH=false`. Configurează aceleași trei variabile în Vercel și publică o versiune nouă.

Implementarea urmează [SDK-ul oficial Sameday](https://github.com/sameday-courier/php-sdk): autentificare `/api/authenticate`, servicii/puncte de ridicare `/api/client/*`, emitere `/api/awb`, PDF `/api/awb/download/{number}/{format}`. Nu există reîncercare automată a unei emiteri cu rezultat incert. Istoricul AWB-ului rămâne în baza de date, inclusiv după schimbarea credențialelor; utilizarea pe alt cont sau mediu este blocată.

## Solicitările de ofertă

Formularul trimite solicitările prin Resend de la **Makeon <info@makeon.ro>** către **mariusmachedon@ymail.com**. `Reply-To` este adresa clientului, pentru răspuns direct la solicitare. Aceleași valori pentru `RESEND_FROM_EMAIL` și `CONTACT_EMAIL_TO` trebuie configurate și în mediul de producție, apoi publicată o versiune nouă. Primirea și redirecționarea mesajelor trimise direct la `info@makeon.ro` se configurează separat la furnizorul de email/DNS.

E-mailul include numele, adresa de e-mail, soluția dorită, dimensiunea echipei și detaliile opționale completate. Poți răspunde direct la e-mail pentru a contacta solicitantul. Aceste solicitări nu apar în lista de comenzi și nu rezervă stoc. Telefonul și WhatsApp rămân alternative de contact.

## Dacă întâmpini o problemă

- **Produsul nu apare:** verifică opțiunea **Vizibil în magazin**, salvează și reîncarcă pagina magazinului.
- **Nu se poate cumpăra:** verifică prețul și stocul disponibil. Dacă sunt corecte, contactează echipa tehnică pentru verificarea plăților.
- **Imaginea nu se salvează:** verifică formatul, limita de 3 MB și descrierea imaginii. Dacă eroarea persistă, trimite mesajul afișat echipei tehnice.
- **Stocul nu poate fi redus:** verifică ambalajele rezervate pentru plăți în curs; stocul fizic trebuie să le acopere.
- **O comandă are o problemă de plată:** notează referința comenzii și contactează echipa tehnică. Nu modifica stocul pentru a corecta o plată neclară.

Când ceri ajutor, trimite pagina pe care apare problema, mesajul de eroare și, dacă este necesar, referința comenzii. Nu trimite parole sau date de card.


## Plata cu cardul, ramburs și facturarea pe firmă

Din coș, **Continuă comanda** deschide `/finalizare-comanda`. Clientul completează contactul și adresa de livrare și alege card online sau ramburs. Transportul este inclus în total în ambele cazuri. Rambursul funcționează și fără Stripe configurat; necesită baza de date, `APP_URL` și `SHIPPING_PRICE_BANI`. Plata cu cardul necesită suplimentar cheile Stripe și webhook-ul.

La **Persoană juridică** se cer denumirea firmei, CUI / CIF și sediul social; numărul Registrului Comerțului este opțional. Datele apar în **Plată și facturare**, separat de livrare. Sistemul salvează datele pentru facturare; nu emite automat facturi și nu transmite documente în e-Factura.

Comenzile ramburs din stoc scad stocul imediat, o singură dată. O comandă ramburs neexpediată poate fi anulată din panoul **Plată ramburs**, restabilind stocul o singură dată. Anularea este blocată dacă există un AWB creat, în curs sau neconfirmat; aceste situații se verifică în eAWB și cu echipa tehnică. Retururile după expediere se gestionează separat, după recepția fizică a produselor.

După verificarea încasării banilor, apasă **Marchează încasat**, verifică suma și apasă **Confirmă încasarea**. Butonul este disponibil indiferent de etapa livrării; confirmarea plății nu modifică statusul livrării. Trecerea la **Livrată** nu marchează automat plata. Factura curierului se achită separat conform contractului firmei.

Înainte de publicare rulează `npm run cms:migrate` pentru `20261029_120000_payment_methods`, cu `PAYLOAD_DB_PUSH=false`. Migrarea păstrează comenzile existente și le atribuie metoda card. Nu se colectează date de firmă retroactiv pentru comenzile vechi.

Pentru separarea plăților online de comenzile înregistrate, rulează și migrarea `20261029_140000_checkout_reservations` prin aceeași comandă, înainte de publicarea codului nou. Adaugă tabela tehnică `checkout_reservations`; nu mută și nu șterge comenzile existente. Checkout-urile deschise de versiunea veche rămân compatibile cu reconcilierea Stripe.


La plata cu cardul, deschiderea Stripe nu înregistrează o comandă în lista de administrare. La întoarcerea în magazin fără plată, sesiunea este închisă, stocul este eliberat imediat după confirmarea Stripe și încercarea temporară este ștearsă complet. Coșul rămâne disponibil. Lista și contoarele includ numai comenzi plătite, ramburs și la cerere. Dacă plata s-a finalizat în același timp cu revenirea, comanda plătită este păstrată. Încercările vechi din stoc marcate Expirată/Eșuată sunt eliminate automat la următoarele verificări ale catalogului; comenzile la cerere rămân înregistrate.


Panoul comenzii încarcă statusul plății și metoda de plată din comanda salvată pe server. La emiterea AWB, **Ramburs de încasat** permite expedierea fără plată în avans și preia totalul produselor plus transportul. Pentru **Plătită**, suma de încasat pe AWB este zero. Pentru o solicitare ramburs la cerere încă neconfirmată, stabilește mai întâi prețurile și transportul în **Confirmare telefonică și plată**, apoi apasă **Confirmă comanda ramburs**. Secțiunea de confirmare este afișată înaintea celei de AWB.
