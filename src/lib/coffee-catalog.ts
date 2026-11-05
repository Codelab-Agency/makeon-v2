export type CoffeeCategory = "boabe" | "macinata" | "solubila" | "alternative" | "decaff" | "complementare";
export type DecaffFormat = "boabe" | "macinata";
export type CoffeeProduct = {
  id?: number;
  updatedAt?: string;
  stock?: number;
  imageUrl?: string;
  imageAlt?: string;
  slug: string;
  name: string;
  category: CoffeeCategory;
  collection: string;
  grams?: number | null;
  unitLabel?: string | null;
  decaffFormat?: DecaffFormat | null;
  description: string;
  notes: string[];
  color: string;
  origin?: string;
  altitude?: string;
  variety?: string;
  processing?: string;
  roast?: string;
  source: string;
  price: number | null;
};

// Prețurile sunt intenționat null până la confirmarea listei comerciale.
// Sumele se configurează în RON, cu TVA inclus. Nu se deduc din oferta Vero Aqua.
export const coffeeProducts: CoffeeProduct[] = [
  {
    slug: "intense",
    name: "Intense",
    category: "boabe",
    collection: "Everyday blends",
    grams: 500,
    description:
      "O cafea puternică, cu un gust bine conturat. Pentru cei care preferă un ritual intens.",
    notes: ["Gust bine conturat", "Caracter intens"],
    color: "#dfbc42",
    roast: "Intensă",
    source: "IMG_3587.jpg",
    price: null,
  },
  {
    slug: "noblesse",
    name: "Noblesse",
    category: "boabe",
    collection: "Everyday blends",
    grams: 500,
    description:
      "Fină, aromată și fructată. Un profil elegant pentru pauzele în care vrei să savurezi fiecare înghițitură.",
    notes: ["Fructat", "Fin", "Aromat"],
    color: "#273b32",
    roast: "Medie",
    source: "IMG_3587.jpg",
    price: null,
  },
  {
    slug: "armonia",
    name: "Armonia",
    category: "boabe",
    collection: "Everyday blends",
    grams: 500,
    description:
      "O îmbinare fină între un gust bine conturat și o aromă dulce, fructată.",
    notes: ["Dulce", "Fructat", "Echilibrat"],
    color: "#c57960",
    roast: "Mediu-intensă",
    source: "IMG_3588.jpg",
    price: null,
  },
  {
    slug: "exotic-blend",
    name: "Exotic Blend",
    category: "boabe",
    collection: "Everyday blends",
    grams: 1000,
    description:
      "Un amestec de cafele cu profile diferite, pentru consistență, gust și miros în fiecare băutură preparată.",
    notes: ["Amestec de profile", "Gust conturat"],
    color: "#b5934a",
    roast: "Mediu-intensă",
    source: "IMG_3588.jpg",
    price: null,
  },
  {
    slug: "etiopia",
    name: "Etiopia",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Cafea din regiunea Yirgacheffe, cu accente florale și aciditate medie.",
    notes: ["Floral", "Gust puternic"],
    color: "#a54c36",
    origin: "Etiopia · Yirgacheffe",
    altitude: "1.500–1.800 m",
    variety: "Ethiopian Heirloom",
    processing: "Spălare și uscare la soare",
    source: "IMG_3589.jpg",
    price: null,
  },
  {
    slug: "brazilia",
    name: "Brazilia",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Recoltată manual la maturitate și procesată semi-umed. Un profil cu corp și aciditate redusă.",
    notes: ["Toffee", "Ciocolată", "Cireșe"],
    color: "#ac4934",
    origin: "Brazilia",
    altitude: "1.400 m",
    variety: "Bourbon, Mundo Novo",
    processing: "Uscare la soare pe paturi suspendate",
    source: "IMG_3590.jpg",
    price: null,
  },
  {
    slug: "columbia",
    name: "Columbia",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Cafea Columbia Supremo, procesată prin metoda umedă și uscată la soare.",
    notes: ["Ciocolată", "Strugure"],
    color: "#b35338",
    origin: "Columbia",
    altitude: "1.500 m",
    variety: "Columbian",
    processing: "Spălare și uscare la soare",
    source: "IMG_3591.jpg",
    price: null,
  },
  {
    slug: "guatemala",
    name: "Guatemala",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Un profil dulce, cu o corpolență bogată și note de ciocolată și condimente.",
    notes: ["Fructe tropicale", "Ciocolată", "Scorțișoară"],
    color: "#a34c3b",
    origin: "Guatemala",
    altitude: "1.550 m",
    variety: "Bourbon, Catuai",
    processing: "Spălare și uscare la soare",
    source: "IMG_3592.jpg",
    price: null,
  },
  {
    slug: "india",
    name: "India",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Cafea din regiunea Malabar, cu boabe expuse musonilor și un caracter distinct.",
    notes: ["Fructat", "Plante", "Nuci"],
    color: "#a65b38",
    origin: "India · Malabar",
    altitude: "900–1.500 m",
    variety: "100% Arabica",
    processing: "Metodă musonică",
    source: "IMG_3593.jpg",
    price: null,
  },
  {
    slug: "costa-rica",
    name: "Costa Rica",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Cafea din regiunea Tarrazu, cu o savoare ușoară, prospețime și un profil mătăsos.",
    notes: ["Vanilie", "Cacao", "Nuci"],
    color: "#b3573b",
    origin: "Costa Rica · Tarrazu",
    altitude: "1.200–1.800 m",
    variety: "100% Arabica",
    processing: "Spălare și uscare la soare",
    source: "IMG_3594.jpg",
    price: null,
  },
  {
    slug: "kenia",
    name: "Kenia",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Cultivată la altitudine, cu o aromă florală și un postgust lung.",
    notes: ["Coacăze roșii", "Zmeură", "Căpșuni"],
    color: "#ac4c37",
    origin: "Kenia",
    altitude: "1.600–1.700 m",
    variety: "Bourbon",
    processing: "Umedă",
    source: "IMG_3595.jpg",
    price: null,
  },
  {
    slug: "indonezia",
    name: "Indonezia",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Un profil puternic și consistent, cu aciditate redusă și o notă ușor afumată.",
    notes: ["Ciocolată", "Lemn afumat", "Vin de porto"],
    color: "#a0523d",
    origin: "Indonezia",
    altitude: "1.200–1.400 m",
    variety: "100% Arabica",
    processing: "Spălare și uscare la soare",
    source: "IMG_3596.jpg",
    price: null,
  },
  {
    slug: "organic",
    name: "Organic",
    category: "macinata",
    collection: "Origin collection",
    grams: 250,
    description:
      "Cafea din platourile înalte Kivu, RD Congo. Gust echilibrat, aciditate fină și note subtile de fructe roșii.",
    notes: ["Fructe roșii", "Floral"],
    color: "#87a244",
    origin: "RD Congo · Kivu",
    altitude: "1.450–2.000 m",
    variety: "100% Arabica",
    processing: "Spălare și uscare la soare",
    source: "IMG_3597.jpg",
    price: null,
  },
  {
    slug: "decaff",
    name: "Decaff",
    category: "decaff",
    decaffFormat: "macinata",
    collection: "Fără cofeină",
    grams: 250,
    description:
      "Cafea din Columbia Huila, decofeinizată prin metoda Swiss Water.",
    notes: ["Ciocolată", "Citrice"],
    color: "#4486a7",
    origin: "Columbia · Huila",
    altitude: "1.300–1.600 m",
    variety: "Caturra, Colombia și Tipica",
    processing: "Swiss Water",
    source: "IMG_3598.jpg",
    price: null,
  },
  {
    slug: "solubila",
    name: "Solubilă Peru BIO",
    category: "solubila",
    collection: "Instant rituals",
    grams: 100,
    description:
      "Cafea liofilizată din Arabica din Puno Norte, Peru. Se prepară prin simplă mixare, inclusiv pentru frappe-uri.",
    notes: ["Fructe", "Ciocolată", "Nuci"],
    color: "#8d9c42",
    origin: "Peru · Puno Norte",
    altitude: "1.900 m",
    variety: "100% Arabica",
    processing: "Congelare / liofilizare",
    source: "IMG_3584.jpg",
    price: null,
  },
  {
    slug: "chicory",
    name: "Chicory",
    category: "alternative",
    collection: "Altfel de ritualuri",
    grams: 100,
    description:
      "Extract de secară, orz, cicoare și sfeclă de zahăr. Se prepară cu lapte sau apă, fierbinte ori rece. Conține gluten.",
    notes: ["Cereale", "Aromă subtilă"],
    color: "#c6a148",
    processing: "Băutură instant",
    source: "IMG_3585.jpg",
    price: null,
  },
  {
    slug: "kopi-luwak",
    name: "Kopi Luwak",
    category: "boabe",
    collection: "Specialty selection",
    grams: 150,
    description:
      "Selecție specialty din Indonezia, cu aromă florală, note de caramel și prăjire medie.",
    notes: ["Floral", "Caramel", "Echilibrat"],
    color: "#282f27",
    origin: "Indonezia",
    altitude: "1.100–1.500 m",
    roast: "Medie",
    processing: "Spălare și uscare la soare",
    source: "IMG_3583.jpg",
    price: null,
  },
];

export const categories: { value: "all" | CoffeeCategory; label: string }[] = [
  { value: "all", label: "Toate cafelele" },
  { value: "boabe", label: "Cafea boabe" },
  { value: "macinata", label: "Cafea măcinată" },
  { value: "solubila", label: "Solubilă" },
  { value: "alternative", label: "Alternative" },
  { value: "decaff", label: "Decaff" },
  { value: "complementare", label: "Complementare" },
];
export const categoryLabel = (category: CoffeeCategory) =>
  categories.find((c) => c.value === category)?.label ?? category;
export const productBySlug = (slug: string) =>
  coffeeProducts.find((p) => p.slug === slug);
export const money = (value: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(
    value,
  );
