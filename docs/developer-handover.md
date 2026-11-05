# Makeon — Developer handover

This guide is for developers taking over the application. It describes the
implemented behavior, the code responsible for it, and the operational steps
needed to maintain it. No access to the original development team is required
to run the project once the repository and service credentials are available.

## 1. Application overview

Makeon combines a company website for SwitchMorn Coffee and Vero Aqua with a
coffee store and an authenticated administration dashboard. The public UI and
Payload CMS run in the same Next.js application. PostgreSQL, media storage,
payments, and email delivery are external services.

| Layer | Implementation |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| CMS and authentication | Payload CMS with PostgreSQL adapter |
| Database | Neon PostgreSQL |
| Media | Cloudflare R2 through the Payload S3 storage plugin |
| Payments | Stripe Checkout and signed webhooks |
| Contact email | Resend |
| Visuals | Three.js, GSAP, SVG, CSS |
| Current hosting | Vercel; optional standalone build for a VPS |

Use `package-lock.json` and `npm ci` for reproducible dependency installation.
The integration was developed with Node.js 24; use a supported Node version
compatible with the versions locked in the repository.

## 2. Repository map

| Location | Responsibility |
| --- | --- |
| `src/app/(site)/` | Public pages, store, product detail, payment result |
| `src/app/(payload)/` | Payload admin routes, layout, custom admin stylesheet |
| `src/app/api/` | Contact, catalog, checkout, production requests, Stripe webhook |
| `src/payload.config.ts` | CMS, database, R2, admin components, allowed origins |
| `src/cms/collections.ts` | Users, media, products, orders, access rules and hooks |
| `src/payload-types.ts` | Generated CMS types; regenerate after collection changes |
| `src/lib/storefront.ts` | Public catalog mapping and active-product filtering |
| `src/lib/commerce.ts` | Stock checkout, transactions, Stripe sessions, reconciliation |
| `src/lib/production-orders.ts` | Made-to-order requests and administrator payment links |
| `src/lib/commerce-validation.ts` | Cart validation, grinding options, money conversion |
| `src/lib/commerce-env.ts` | Configuration checks and payment availability |
| `src/lib/contact-request.ts` | Contact validation and Resend submission |
| `src/components/cart-provider.tsx` | Persisted cart and choice of checkout flow |
| `src/components/admin/` | Dashboard, order summary, payment-link panel, list presentation |
| `src/migrations/` | Versioned schema changes and custom SQL constraints |
| `scripts/bootstrap-commerce.ts` | Initial administrator and missing catalog products |
| `scripts/verify-migrations.mjs` | Migration verification on an explicitly configured clone |
| `tests/commerce/` | Database integration tests and mocked payment/email providers |
| `tests/*.spec.ts` | Playwright UI checks |

Business copy and catalog fallback data also live in `src/lib/coffee-catalog.ts`
and the relevant public components. Product data from the CMS takes precedence
once the CMS is configured.

The company landing is dispatched through `src/components/makeon-landing.tsx`.
`HomeOverview` composes `/`; `CoffeeOfficeLanding` and `WaterLanding` render
`/cafea-pentru-birouri` and `/apa`. `EventLanding` renders the dedicated
`/cafea-la-evenimente` route. These pages show their service immediately, without
coffee/water switches or Three.js scenes. Legacy animation experiments remain
inactive and have not been removed.

The home hero introduces coffee and water together. On wide, tall windows with
motion enabled, one ScrollTrigger timeline changes the panorama into a 55%/45%
image/offer composition. The stage uses native CSS sticky positioning and 0.75
viewport heights of extra scene length; no DOM reparenting or forced wheel/snap
behavior is added. On smaller windows, reduced motion and no-JavaScript renders,
the complete static composition remains in normal flow. The image at
`public/images/makeon-office-hero-v2.webp` was generated from equipment references;
it is illustrative, not evidence of a customer installation. A masked title
entrance settles within 800ms on desktop or 650ms on mobile, and completes when
scrolling starts. Text stays anchored; keyboard access and the solutions anchor
expose the actual offer controls at the readable end of the scene.
`HomeSupport` renders two branded campaign panels with one contextual enquiry per
service. Coffee uses a graphite surround, original SwitchMORN photograph in a dark
10px mount, and a large Cormorant title. Water uses a blue-gray stage with the
original transparent dispenser, temperatures and qualified filtration information.
Both put title/copy before media in the mobile reading order, followed by a lower
commercial rail and action. The heading accents load Cormorant's real variable
italic face through the public layout. The former six icon columns and specialist
link strip are removed. Price/contract conditions are visible, then
the shop selection takes the former event section's position. The photographic
event chapter follows the shop; its two format links reach the dedicated events
page, which is also accessible through the shared navigation.
The product selection reuses
`CoffeeProductCard`, the catalog provider and the existing cart action.

`typography.css` assigns Cormorant Garamond Variable to public headings and DM Sans
Variable to body text and controls. Disclosure titles, modal titles and service
heading overrides use the same heading token; price numerals retain DM Sans.
`business.css` isolates service typography and surfaces under `.b2b-site`;
`home.css` controls the continuation and shared `SiteFooter`;
`opening.css` and `use-home-opening-motion.ts` own the opening and entrance;
`service-compositions.css` adapts the service compositions, and
`office-service-pages.css` scopes the compact reading layouts, with
`service-editorial.css` providing the photographic coffee hero, equipment offer,
three-zone water hero and large water-context/inclusions composition.
`media-frames.css` gives content photography a warm matte mount, fine edge and
small rounded corners. Equipment, product cards and product-detail galleries
share the same frame tokens. Original image colors and proportions are retained;
brand marks and the full-bleed opening keep their existing presentation.
`use-presentation-entrance.ts` owns service heroes, while
`use-site-choreography.ts` owns coordinated sections, products and event pairs.
Their scopes and animated layers remain separate. The shop keeps
its original product typography, cards, filters and checkout UI. `SiteHeader`
provides a light sticky header with five direct service/company/store links.
Below 1280px it uses the existing native-dialog menu. The menu closes before
opening the cart or offer form. The shared footer provides identity and contact
on the left, two small navigation groups on the right and the
existing legal/cookie-policy/ANPC links. No cookie-settings manager exists in the
project; the footer retains the existing policy link.

The home hero opens the unchanged contact form with coffee and water selected;
its secondary link reaches the actual offers at `#solutii`. Home anchors `#despre`,
`#ecosistem`, `#servicii`, `#magazin`, `#evenimente` and `#abonamente` are retained. The latter
targets the compact footer enquiry access. Coffee and water pages keep their
equipment, services and subscription information visible. Only FAQ answers
collapse, below a heading aligned above the questions in one centered column.

`src/lib/business-content.ts` centralizes approved water conditions and service
copy. The water offer is 31 EUR + VAT/month/apparatus for 36 months, total 1,116 EUR
+ VAT/apparatus. Coffee costs, installation and maintenance are confirmed in a
personalized offer. Do not invent equipment capacities, coffee subscription
prices, event capacities, transport inclusions or package prices: those details
still require client confirmation. Vero's four stages + UV and three water
temperatures describe the presented apparatus rather than every filtration system.

Event enquiries retain the existing `eventServices` values and `/api/contact`
payload. Guest count uses the existing team field; date, locality, duration and
format use the message field with a persistent input hint. Contact validation,
idempotent retry, provider submission and success/error behavior are unchanged.
`CatalogProvider` and `CartProvider` stay mounted in the public layout. No
commerce APIs, stock/variant/price rules, storage keys or payment logic changed.

## 3. Accounts, access, and environment

The owner should retain access to the Git repository, Vercel project, Neon
project, Cloudflare account/bucket/DNS, Stripe account, Resend account, domain
registrar, and an administrator account. Transfer service access through each
provider's account controls; credentials do not belong in this document.

Use `.env.example` as the configuration inventory. Local Next.js supports its
usual environment files. The migration verification command specifically reads
`.env`, while the bootstrap script loads environment variables through Next.js.
Keep the file used by a command consistent with its intended database.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Application PostgreSQL connection, with SSL for Neon |
| `PAYLOAD_SECRET` | Stable authentication secret, at least 32 characters |
| `APP_URL` | Canonical public origin used by checkout and origin checks |
| `ADMIN_ALLOWED_ORIGINS` | Additional exact admin origins, comma-separated |
| `PAYLOAD_DB_PUSH` | Defaults to disabled; `true` only for disposable local databases |
| `MIGRATION_TEST_DATABASE_URL` | Separate database/Neon endpoint for clone verification |
| `R2_ENDPOINT` | S3 endpoint, distinct from the public media URL |
| `R2_BUCKET` | Product image bucket |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Server-side S3 credentials scoped to the bucket |
| `R2_PUBLIC_URL` | Public media domain or enabled R2 development URL |
| `STRIPE_SECRET_KEY` | Server-side Stripe key, test or live as appropriate |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the configured webhook endpoint |
| `SHIPPING_PRICE_BANI` | Stock-checkout shipping amount as integer bani; explicitly set `0` for free shipping |
| `RESEND_API_KEY` | Server-side email provider key |
| `RESEND_FROM_EMAIL` | Sender, normally on a domain verified in Resend |
| `CONTACT_EMAIL_TO` | Recipient of contact requests |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial bootstrap only; remove password afterwards |
| `NEXT_OUTPUT_STANDALONE` | `true` enables the optional standalone Next.js build |

Do not put these credentials in `NEXT_PUBLIC_*`. Production and preview should
use separate databases and appropriate test/live provider configuration.

## 4. Local development and initialization

```sh
npm ci
npm run cms:types
npm run cms:importmap
npm run cms:migrate
npm run dev
```

Configure a development database before migration. Open the site at
`http://localhost:3000` and the dashboard at `/admin`. On Windows, `npm.cmd` can
be used if PowerShell blocks `npm.ps1`.

For a new database only, run `npm run cms:bootstrap` after migrations. The npm
script includes `--conditions=react-server` for server-only dependencies; do not
invoke the bootstrap with bare `tsx`. It creates the first administrator if none
exists, requiring a password of at least 16
characters, and imports missing product slugs. Existing products are not
overwritten. Seed products begin with zero stock and unconfirmed prices.

An inherited database already contains users and catalog data. Obtain a valid
administrator account rather than expecting bootstrap to reset its password.
Public creation of the initial administrator is blocked.

## 5. Data model and access rules

- **Users:** authenticated dashboard users. The project does not implement a
  granular multi-role permissions system.
- **Media:** public product images; write operations require authentication.
  Local file storage is disabled. Missing R2 configuration blocks uploads.
- **Products:** unique slug, category, gram weight, description, notes, optional
  price in RON, physical stock, reserved quantity, image, and visibility flag.
  Product deletion is blocked; hide discontinued products with `active=false`.
- **Orders:** immutable financial/product snapshots, customer information,
  payment state, fulfillment state, Stripe identifiers, and order type.
  Financial changes are handled by server services, not ordinary admin edits.

The storefront explicitly filters active products and maps an allowlist of
public fields. Payload's Local API may bypass collection access rules; preserve
this filtering when changing server-side catalog code.

Without CMS configuration, a presentation catalog is available. Once configured,
database failures propagate rather than substituting stale catalog prices.
The public catalog query currently limits results to 1,000 products.

## 6. Money, stock, and payment invariants

Product `price` uses RON. Orders store `totalBani`, `shippingBani`, and
`unitPriceBani` as integer bani, matching Stripe. The dashboard displays these
values in RON. Use the shared conversion/validation helpers; do not accept prices
or totals supplied by the customer browser.

`stock` is physical inventory, including reserved units. `reserved` is inventory
held for pending stock payments. Sellable inventory is `stock - reserved`.

Stock reservation uses conditional SQL updates inside a transaction. Confirmation
deducts physical stock and releases its reservation atomically. Confirmed expiry
or cancellation releases reservations without deducting stock. Product locks
are acquired in ID order, and order advisory locks serialize retries across
application instances. Pass the transaction request through Payload Local API
writes so they use the same connection as raw SQL.

Two PostgreSQL constraints enforce valid stock/reservation quantities and
positive prices with at most two decimals: `products_inventory_valid` and
`products_price_valid`. Application hooks also protect reserved stock during
admin edits; bulk product edits are blocked. Do not remove these safeguards.

### Stock checkout

`POST /api/checkout` calls `createCheckout()` in `src/lib/commerce.ts`.
The server validates the cart, reserves stock, stores the order snapshot, and
creates a Stripe Checkout session. A cart fingerprint rejects altered submissions
using the same order key. The order reference is the Stripe idempotency key.
Stock reservations expire after approximately 35 minutes.

`applySession()` is the shared payment reconciliation function. Both the Stripe
webhook and `/comanda` result page call it. It verifies session identity, currency,
amount, and order state before committing payment and inventory changes. Repeated
payment notifications do not deduct stock again. Customer name, email, phone,
and delivery address are copied from Stripe when provided; existing values are
retained otherwise.

### Made-to-order checkout

`POST /api/orders/request` calls `createProductionRequest()`. Products without
stock or confirmed prices can be requested without immediate payment. A mixed
cart follows this flow in its entirety. The request stores customer contact
details and starts with `orderType=production`, `status=requested`.

An authenticated administrator confirms unit prices and shipping through
`POST /api/orders/payment-link`, which calls `generateProductionPayment()`.
The quote and payment attempt are persisted before Stripe session creation.
Pending quotes are frozen; retries reuse the same attempt and active link.
The Stripe key includes the order reference, production flow, and attempt.
Links expire after approximately 23 hours. Regeneration requires confirmed
expiry or a definitive creation failure; ambiguous network errors are retryable.

The administrator copies and sends the link manually. It is not emailed
automatically. Paid production orders use `applySession()` but never reserve or
deduct physical stock, including mixed carts. The server blocks fulfillment
changes before payment. Old expiry notifications from replaced links are ignored;
conflicting paid sessions are rejected.

### States and webhook configuration

Payment states are `requested`, `pending`, `paid`, `expired`, and `failed`.
Fulfillment states are `new`, `processing`, `shipped`, and `delivered`.
Payment state and fulfillment state are separate concerns.

Stripe should send `checkout.session.completed` and `checkout.session.expired`
to `/api/stripe/webhook`. The route verifies the signature against the raw
request body. Test and live webhook endpoints have different secrets. Local
forwarding through Stripe CLI also supplies its own signing secret.

Expiry is reconciled by webhook and opportunistically during commerce requests.
There is no dedicated scheduled reconciliation worker. Network failures should
be retried/reconciled; do not manually mark an order paid or release a reservation
without checking its actual Stripe session.

## 7. Schema migrations

Product categories include `decaff` and `complementare` since migration
`20261007_132345`. Decaff uses `decaffFormat` (`boabe` or `macinata`).
Complementary products have a required selling-unit description (`unitLabel`)
and nullable grams; coffee-only fields are hidden in the admin. Coffee still
requires grams and collection through server validation. These conditions apply
to partial updates as well as creation.

`src/lib/product-format.ts` centralizes display units and selection rules.
Complementary cart/order lines use the internal `Standard` discriminator in the
existing `grind` field; it is not a grinding option. Both payment flows validate
this against the server product and snapshot the selling unit in the order name.
Product pages for ground coffee, including ground Decaff, expose the accessible
grinding guide. Existing historical order snapshots remain unchanged.

Schema push is disabled by default in both development and production. It can
remove custom SQL constraints; enable it only on a disposable local database.
Never rewrite an applied migration or run a database reset against shared data.

For each change: generate a migration with `npm run cms:migrate:create`, inspect
its SQL and rollback, test on a copy, preserve a backup, then run
`npm run cms:migrate` against the intended database before publishing compatible
application code. Keep the ordered registry in `src/migrations/index.ts` aligned
with the migration files. Changes to generated types/import maps are committed
with the code that requires them.

The historical development schema-push issue was repaired on 5 October 2026:
production-order fields were added, inventory constraints were restored, and
the `dev` marker was removed after data verification. This is completed recovery
work, not a step that must be repeated on every deployment.

`npm run cms:migrate:verify` is a guarded recovery verifier for an existing clone:
it reads `.env`, refuses the main endpoint, requires the first four historical
migrations, compares existing-column data hashes, validates inventory constraints,
and clears the clone's `dev` marker only after success. It expects existing data
to remain unchanged; intentional data migrations may need a different verifier.
It does not create a backup or apply migrations to the main database.

Additive migrations usually preserve rows. Column/table deletion, incompatible
type conversion, and some rollbacks may destroy data and require separate review.

## 8. Deployment, backup, and migration to a VPS

On Vercel, configure server environment variables for the correct deployment
environment. Run reviewed migrations once before deploying the application.
`npm run build` produces the production build; `npm run start` serves it locally.
Check the public catalog, authenticated dashboard, R2 upload, and a Stripe test
checkout including webhook delivery before enabling live payments.

Keep database and media backups separately. A Neon branch is useful for testing
or a pre-migration snapshot, but it is not an independent off-provider backup.
Use PostgreSQL `pg_dump`/`pg_restore` for portable backups and practice restoration.
Database backups do not contain the R2 image files. Preserve object keys and
public URLs when copying media.

For a VPS, the application can continue using Neon and R2, or these services can
be moved separately. Enable `NEXT_OUTPUT_STANDALONE=true` before build; deploy
`.next/standalone` together with `.next/static` and `public` at their expected
paths, then start the generated `server.js`. Provide a reverse proxy/TLS,
process management, environment variables, and backups. Update `APP_URL`,
allowed admin origins, media URLs if changed, and the Stripe webhook destination.
Verify migrations, sequences, constraints, image access, and payments after a move.

## 9. Tests and validation

```sh
npm run typecheck
npm run build
```

The database integration suite uses only local PostgreSQL on
`127.0.0.1:55432/makeon_test`. It replaces the database URL and clears that test
database's products/orders. Payment and contact-provider calls are mocked.

```sh
docker run --name makeon-postgres-test -e POSTGRES_PASSWORD=makeon-local-test-only -e POSTGRES_DB=makeon_test -p 127.0.0.1:55432:5432 -d postgres:17-alpine
npm run test:commerce
```

Playwright expects the application to be running at `http://127.0.0.1:3000` and
uses installed Google Chrome. Run `npm run test:e2e`. Browser commerce tests use
mocked catalog/payment responses and do not replace real Stripe end-to-end testing.
Check mobile layouts and reduced motion when changing navigation or animations.

The branded campaign revision passed production build (including TypeScript) and
43 affected home/offer/event/form/scroll cases. Nine widths from 320 to 1920px
retain the commercial actions, shop, events and footer without overflow or browser
errors. The rendered campaign captures are at
`artifacts/home-media-refresh/campaign/home-solutions-390.png` and
`home-solutions-1440.png`. The original coffee photograph remains cropped to 4:3
without water bottles; no new image generation or source retouching was used.

The preceding editorial home rows and Cormorant heading update passed production build,
TypeScript checking and 67 targeted cases, including contextual offers/WhatsApp
selections, focus restoration, disclosures, modal layout, service choreography,
anchors, smooth scrolling and the home/shop/event order. Font checks cover seven
public routes at 390 and 1440px, with correct heading/body families and Romanian
glyph loading; evidence is under `artifacts/heading-font/`.
Nine-width checks from
320 to 1920px include the exact 900/901px composition boundary and confirm both
summaries, all three products, working cart actions and visible event/footer
content without overflowing summary text. Current evidence is under
`artifacts/home-media-refresh/` (gitignored).

The preceding 28 October home/media update passed production build and 120 selected
browser cases. After restoring events below the shop, build and the 38 affected
home/offer/event cases passed again. Home checks at seven widths from 320 to
1920px retain all three products, working cart actions, events and footer contact
details. The final photo crop and responsive captures are saved under
`artifacts/home-media-refresh/` (gitignored). Source photographs remain unretouched;
the client-provided coffee photograph uses a CSS 4:3 crop without water bottles.
Interactive section controls use opacity entrances to keep their click areas
stationary. Pointer holds pause any remaining section movement until activation
or release. Reduced motion explicitly retains native `scroll-behavior: auto`.

The preceding service-body refinement keeps both heroes and replaces the service
drawers/intermediate anchor menus with visible equipment, coffee, filtration and
service compositions. Only FAQ answers collapse. The shared offer form retains
all canonical service selections, including installation and maintenance.
It passed production build and 64 targeted Playwright cases. Both service pages
were checked from 320 through 1920px without overflow, broken images or browser
errors; hero pixel crops match the baseline at 390 and 1440px. Current comparison:
`artifacts/service-body-refresh/review.html` (gitignored). The pass uses Chrome
and emulated mobile viewports, without physical-device, zoom or RTL verification.

The preceding presentation refinement passed a production build, TypeScript and
124 selected Playwright cases across smooth scrolling, the panoramic home opening,
office offers/navigation, water, events, contact, services, catalog loading,
commerce UI, unavailable cart, cart layout and shop suites. Checks include
resize, reduced motion, JavaScript-disabled rendering, overlay locks,
anchor offsets, history/focus restoration, native mobile touch scrolling,
header/menu alignment, modal focus boundaries, contextual form payloads,
measured disclosures, photographic pairs and product catalog loading/retry.
The additional frame-sampled choreography checks cover service hero masks/title
lines, water conditions/inclusions, product stagger, section completion,
native sticky scene progress and an early pointer gesture during hydration.
The six mocked contact-provider tests passed during the preceding redesign. This is not
a claim that every historical visual/animation suite passes. No real order,
payment or customer email was created. Current home/office captures cover
390 and 1440px, with an additional 320px water check; the browser suites also
cover intermediate widths and 1920px. Earlier shop comparisons matched the
saved baseline at 390 and 1440px. That phase's comparison is
`artifacts/service-choreography/review.html` (gitignored), with current captures
and four actual Chromium interaction recordings encoded as animated WebP;
earlier directions remain in `artifacts/polish/`, `artifacts/clarity/`,
`artifacts/hero-transfer/`, `artifacts/offers/` and `artifacts/motion/`. See
[opening motion](opening-motion.md) and [presentation design](presentation-design.md) for image roles, motion, references and
commercial constraints. The latest component changes and verification limits
are recorded in [presentation polish](presentation-polish.md).

## 10. Operational troubleshooting and current limits

### Legal content and launch configuration

The legal pages are `/termeni-si-conditii`, `/politica-de-confidentialitate`,
and `/politica-de-cookie-uri`. Public legal details, document version, and draft
flag are centralized in `src/lib/legal.ts`. They are drafts with `noindex` until
the merchant identity, business terms, contact details, and provider/retention
arrangements are approved. Before launch, fill the company fields, confirm the
email/phone and commercial delivery/return details in the pages, and publish the
approved version by updating its version and setting `draft=false`.

Checkout and made-to-order request APIs require `termsAccepted=true` and the
current `legalVersion`; acknowledgement is stored server-side as `legalVersion`
and `legalAcceptedAt` on the order. These fields are optional for historical
orders; do not backfill consent/acceptance that never occurred. This contractual
acknowledgement is separate from marketing consent. The additive migration
`20261005_144420_order_legal_acceptance` is required before deploying this code.

The SAL asset is downloaded unchanged from the official ANPC source:
`https://anpc.ro/download/sal/SAL-PICTOGRAMA.png`, linked from
`https://anpc.ro/sal`. The footer links it to `https://reclamatiisal.anpc.ro/`.
The discontinued European SOL/ODR link is deliberately absent.

Public contact configuration is separate from server-side email configuration.
Review `APP_URL`, `ADMIN_ALLOWED_ORIGINS`, `R2_PUBLIC_URL`, `RESEND_FROM_EMAIL`,
and `CONTACT_EMAIL_TO` in the hosting environment, along with hardcoded contact
links in the public components, before launch. Do not leave the agency test inbox
as the live recipient. Verify sender-domain authorization and Stripe's production
webhook destination. These values must not be guessed from placeholder policies.

| Symptom | First checks |
| --- | --- |
| Admin action denied | Authentication, collection/field access, exact origin, `APP_URL` and `ADMIN_ALLOWED_ORIGINS` |
| Upload fails | All R2 variables, bucket-scoped token, public URL, accepted image type and 3 MB limit |
| Checkout unavailable | Database/secret, Stripe keys and webhook secret, `APP_URL`, explicit shipping amount |
| Paid order still pending | Stripe webhook delivery/signature, stored session ID, amount/currency match, database errors |
| Stock mismatch | Physical vs reserved stock, open/expired sessions, validated SQL constraints; reconcile rather than overwriting reservations |
| Contact email rejected | Verified sender, recipient, Resend response, test-domain recipient restrictions |
| Migration reports development push | Inspect history/schema and use a clone; do not reset or blindly approve destructive SQL |

Contact requests use Resend and are not stored as a separate lead collection.
Their throttle, and the production-request throttle, are per application instance,
not a shared distributed rate limiter. Add shared infrastructure if needed at scale.

Order fulfillment notifications use `src/lib/order-status-email.ts`. The Orders
after-change hook inserts an immutable event into the handwritten
`order_status_emails` table in the same transaction as an administrator's actual
status change. Next.js `after()` drains committed events after the HTTP response;
creation, unchanged saves, and internal payment updates do not enqueue emails.
Local API scripts must call `deliverOrderStatusEmails` after committing if they
need immediate dispatch. The admin panel reads history and offers authenticated,
same-origin retries through `/api/orders/status-email`.

Resend uses the existing `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; a verified
sender domain is required, and the demo `resend.dev` sender is rejected before
attempting customer sends. `CONTACT_EMAIL_TO` remains exclusive to contact
enquiries: status notifications go to the saved customer's email. Messages and
the first sender are snapshotted; per-event keys and atomic 90-second leases
prevent concurrent duplicates. Ambiguous attempts older than 23 hours are
blocked for manual provider reconciliation rather than resent outside Resend's
24-hour idempotency window. A provider acceptance is not inbox delivery. There
is no scheduled retry worker: failed or interrupted dispatches remain persisted
and can be retried in admin. Earlier unresolved events are handled first.

Apply migration `20261011_120000_order_status_emails` before deploying the new
hook. Keep this SQL-owned table when reviewing future generated migrations and
keep schema push disabled. Test against a separate migrated Neon branch with
`node --env-file=.env --conditions=react-server --import tsx --test --test-force-exit tests/order-status-email.test.ts`;
the suite refuses the main endpoint, mocks Resend and deletes only its fixtures.

Payload password-recovery email is not configured. Order payment links are sent
manually. Invoice issuance, shipping-label integrations, subscriptions, and
automated refunds are not implemented. The payment flow is designed for the
configured card Checkout path; additional payment methods/events require explicit
handling and tests. Refunds in Stripe do not automatically restore inventory here.

Custom admin styles target Payload class names, including the mobile navigation
overlay and horizontally scrollable tables. Check these after Payload upgrades.
Three.js/GSAP components handle reduced motion and offscreen work; preserve their
cleanup when changing visuals.

For daily shop operations, refer the owner to the
[administration guide](commerce-setup.md). Keep this handover guide updated when
changing payment behavior, schema, providers, or deployment infrastructure.


### Card / COD and company invoicing (2026-10-29)

`/finalizare-comanda` collects contact, RO delivery address, invoice type and payment method. `checkout-details.ts` validates and canonicalizes the immutable JSON snapshot. Company name, CUI and registered address are required for company invoices; trade registration is optional. Invoices/e-Factura are not generated by this integration.

`ordersConfigured()` enables COD independently of Stripe. `checkoutConfigured()` additionally requires Stripe credentials/webhooks. Catalog exposes separate `checkout` (card) and `cod` flags. Both methods use server-resolved prices, integer bani and order/product locks. Stock COD orders atomically deduct available stock, use `cod_pending`, and never create Stripe sessions. Repeated identical keys return the existing order; changing method or billing data requires a new key. Online payment reconciliation preserves the local customer/billing snapshot.

Production COD requests remain `requested` until the administrator confirms quoted prices and shipping; they then become `cod_pending` without physical stock deductions. Card requests continue to use payment links.

Sameday COD AWBs use `cashOnDelivery = totalBani / 100`; card AWBs use zero. Admin-only `/api/orders/cod` confirms administrator-verified collection independently of fulfillment or cancels unshipped stock COD orders with one-time stock restoration. A created/in-flight/uncertain AWB blocks cancellation. Shipment returns and AWB cancellation reconciliation remain manual operations. Payment collection is never inferred from fulfillment status.

Apply migration `20261029_120000_payment_methods` before deploying the updated app. It adds payment method, checkout details, collection timestamp and additive status enum values. Existing orders default to card; billing snapshots cannot be silently rolled back. Keep schema push disabled outside disposable tests.


### Abandoned card checkouts

Order read access exposes only paid orders, COD orders and production requests, including in dashboard counters. Active stock/card snapshots are internal reservation drafts. On return to any shop route, `use-checkout-return.ts` cancels the previous Stripe session (also via persisted `pageshow` on BFCache restore). Expiration atomically releases reserved stock and deletes the stock/card draft and its child items; expiration webhook retries after deletion are harmless. A completed payment wins cancellation races and remains a paid order. Production requests/payment-link attempts are retained. Legacy released `expired`/`failed` stock/card drafts are pruned in batches during catalog/checkout recovery. Browser state never authorizes deletion before Stripe confirms expiration.

### Sameday personal dropoff (PDO)

The admin defaults `personalDropoff` to true on new AWB requests. `/api/client/services` exposes `serviceOptionalTaxes`; only `taxCode: PDO` with parcel `packageType: 0` enables this mode. The server rechecks availability before dispatch and sends `serviceTaxes[0]=PDO` on `/api/awb`, matching the official Sameday WooCommerce plugin's `PERSONAL_DELIVERY_OPTION_CODE` and `AwbGenerateServiceTaxResolver`. No `lockerLastMile`, `lockerFirstMile`, or `oohFirstMile` is invented: this is sender dropoff with unchanged home delivery. Existing durable AWB claims and COD totals are preserved. PIN/QR retrieval is via eAWB, outside this integration.
