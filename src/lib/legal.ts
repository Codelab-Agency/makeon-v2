/** Public legal/contact configuration. Complete and approve before launch;
 * bump the terms version when publishing a materially revised document.
 */
export const legal = {
  version: "2026-11-06",
  updated: "6 noiembrie 2026",
  draft: true,
  company: {
    name: "VENDING STORE IMPEX SRL",
    cui: "30702112",
    registration: "J40/10880/2012",
    address: "Str. Sg. Maj. Ilie Ancuta nr. 3-9, Sectorul 4, București, cod poștal 040556, România",
  },
  email: "info@makeon.ro",
  phone: "+40 744 524 728",
  phoneHref: "tel:+40744524728",
  terms: "/termeni-si-conditii",
  privacy: "/politica-de-confidentialitate",
  cookies: "/politica-de-cookie-uri",
  sal: "https://reclamatiisal.anpc.ro/",
  anpc: "https://anpc.ro/",
} as const;
