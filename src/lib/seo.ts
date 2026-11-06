import type { Metadata } from "next";
import type { CoffeeProduct } from "./coffee-catalog";
import { categoryLabel } from "./coffee-catalog";
import { packageLabel } from "./product-format";
import { legal } from "./legal";
import { productBrand, productSku, gtinSchemaFields } from "./product-identifiers";

export const site = {
  name: "Makeon",
  url: "https://makeon.ro",
  language: "ro-RO",
  image: "/images/makeon-social.png",
  googleVerification: "BVPz6I0vRBJr7uB0WMoqJ898rGaLYvq6PHKNZomT7KU",
} as const;

export const previewDeployment = () => Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");
export const absoluteUrl = (path = "/") => new URL(path, site.url).href;
export const seoPages = {
  "/": {
    title: "Cafea proaspăt prăjită și apă filtrată pentru birouri | Makeon",
    description: "Cafea SwitchMORN livrată direct din prăjitorie, espressoare în comodat și apă filtrată Vero Aqua. Service și aprovizionare pentru birou, cu un singur partener.",
  },
  "/cafea-pentru-birouri": {
    title: "Cafea de origine pentru birouri și espressoare în comodat | Makeon",
    description: "Cafea proaspăt prăjită, direct din prăjitorie. Espressoare în comodat, alese după echipă și consum, livrări regulate și service pentru biroul tău.",
  },
  "/apa": {
    title: "Apă filtrată pentru birouri și dozatoare Vero Aqua | Makeon",
    description: "Hidratare la birou cu dozatoare Vero Aqua: apă rece, caldă și la temperatura camerei. Abonament cu instalare, mentenanță și schimb de filtre incluse.",
  },
  "/prajitoria": {
    title: "Prăjitoria SwitchMORN: cafea proaspăt prăjită | Makeon",
    description: "Cafea de origine și blenduri SwitchMORN, proaspăt prăjite în loturi mici pentru espresso sau filtru. Descoperă prăjitoria și sortimentele din magazin.",
  },
  "/cafea": {
    title: "Magazin cafea boabe și măcinată SwitchMORN | Makeon",
    description: "Alege cafea boabe, măcinată, decofeinizată și accesorii din magazinul Makeon. Vezi sortimentele SwitchMORN, gramajele, prețurile și disponibilitatea.",
  },
  "/cafea-la-evenimente": {
    title: "Cafea la evenimente: bar mobil și rulotă | Makeon",
    description: "Bar mobil Coffee Corner și rulotă SwitchMORN pentru nunți, botezuri, conferințe și lansări. Alegem formatul după spațiu și invitați. Solicită o ofertă.",
  },
} as const;

export function pageMetadata(path: string, title: string, description: string, image: string = site.image): Metadata {
  const cleanDescription = description.replace(/\s+/g, " ").trim();
  const snippet = cleanDescription.length > 165 ? `${cleanDescription.slice(0, 162).replace(/\s+\S*$/, "")}…` : cleanDescription;
  return {
    title, description: snippet,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { type: "website", siteName: site.name, locale: "ro_RO", url: absoluteUrl(path), title, description: snippet,
      images: [{ url: absoluteUrl(image), alt: title }] },
    twitter: { card: "summary_large_image", title, description: snippet, images: [absoluteUrl(image)] },
  };
}

export function mainPageMetadata(path: keyof typeof seoPages) {
  return pageMetadata(path, seoPages[path].title, seoPages[path].description);
}

export function productTitle(product: CoffeeProduct) {
  return `${product.name} · ${packageLabel(product)} | ${product.category === "complementare" ? "Makeon" : "SwitchMORN · Makeon"}`;
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function organizationGraph() {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": `${site.url}/#organization`, name: site.name, url: site.url,
      legalName: legal.company.name, taxID: legal.company.cui,
      identifier: { "@type": "PropertyValue", propertyID: "Registrul Comerțului", value: legal.company.registration },
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/makeon-logo-preview.png") },
      email: legal.email, telephone: legal.phone, description: seoPages["/"].description,
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", merchantReturnLink: absoluteUrl(legal.returns) },
      brand: [{ "@type": "Brand", name: "SwitchMORN Coffee" }, { "@type": "Brand", name: "Vero Aqua" }],
    },
    { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.name, inLanguage: site.language,
      publisher: { "@id": `${site.url}/#organization` } },
  ] };
}

export function breadcrumbGraph(items: {name: string; path: string}[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item,index) => ({
    "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}

export function serviceGraph(path: keyof typeof seoPages, name: string, serviceType: string) {
  return { "@context": "https://schema.org", "@type": "Service", "@id": `${absoluteUrl(path)}#service`,
    name, serviceType, description: seoPages[path].description, url: absoluteUrl(path),
    provider: { "@id": `${site.url}/#organization` }, areaServed: { "@type": "Country", name: "România" },
  };
}

export function productGraph(product: CoffeeProduct, shippingBani?: number) {
  const url = absoluteUrl(`/cafea/${product.slug}`);
  const brand = productBrand(product);
  const image = product.imageOriginalUrl || product.imageUrl;
  return { "@context": "https://schema.org", "@type": "Product", "@id": `${url}#product`, url,
    name: `${product.name} · ${packageLabel(product)}`, description: product.description,
    category: categoryLabel(product.category), sku: productSku(product),
    ...(image ? { image: [absoluteUrl(image)] } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...gtinSchemaFields(product.gtin),
    ...(product.mpn ? { mpn: product.mpn } : {}),
    ...(typeof product.price === "number" && Number.isFinite(product.price) && product.price > 0 ? { offers: {
      "@type": "Offer", url, priceCurrency: "RON", price: product.price.toFixed(2),
      ...(typeof product.stock === "number" ? { availability: `https://schema.org/${product.stock > 0 ? "InStock" : "OutOfStock"}` } : {}),
      itemCondition: "https://schema.org/NewCondition",
      ...(shippingBani !== undefined && Number.isSafeInteger(shippingBani) && shippingBani >= 0 ? { shippingDetails: {
        "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "RO" },
        shippingRate: { "@type": "MonetaryAmount", currency: "RON", value: (shippingBani / 100).toFixed(2) },
      } } : {}),
      seller: { "@id": `${site.url}/#organization` },
    } } : {}),
  };
}
