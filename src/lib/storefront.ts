import "server-only";
import { coffeeProducts, type CoffeeProduct } from "./coffee-catalog";
import { cmsConfigured } from "./commerce-env";
import { getCMS } from "./cms";
import type { Product } from "@/payload-types";
import { cache } from "react";

/** Explicit public-field allowlist; expose sellable stock and prefer the card-sized image. */
export function publicProduct(doc: Product): CoffeeProduct {
  const image =
    doc.image && typeof doc.image === "object" ? doc.image : undefined;
  return {
    id: doc.id,
    updatedAt: doc.updatedAt,
    brand: doc.brand,
    gtin: doc.gtin,
    mpn: doc.mpn,
    identifiersAbsent: doc.identifiersAbsent,
    googleEnabled: doc.googleEnabled,
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    collection: doc.collection || (doc.category === "complementare" ? "Complementare" : "SwitchMorn"),
    grams: doc.grams,
    unitLabel: doc.unitLabel,
    decaffFormat: doc.decaffFormat,
    description: doc.description,
    notes: doc.category === "complementare" ? [] : doc.notes?.map((n) => n.note) ?? [],
    color: doc.color || "#b5934a",
    origin: doc.origin || undefined,
    altitude: doc.altitude || undefined,
    variety: doc.variety || undefined,
    processing: doc.processing || undefined,
    roast: doc.roast || undefined,
    source: "Makeon Admin",
    price: doc.price ?? null,
    stock: Math.max(0, doc.stock - doc.reserved),
    imageUrl: image?.sizes?.card?.url || image?.url || undefined,
    imageOriginalUrl: image?.url || image?.sizes?.card?.url || undefined,
    imageAlt: image?.alt,
  };
}

/**
 * Static data is used only when CMS is unconfigured; configured CMS failures
 * propagate rather than silently exposing stale prices. Local API access bypasses
 * admin permissions, so active filtering and public-field mapping are mandatory.
 */
export const getProducts = cache(async (): Promise<CoffeeProduct[]> => {
  if (!cmsConfigured()) return coffeeProducts;
  const cms = await getCMS();
  const result = await cms.find({
    collection: "products",
    where: { active: { equals: true } },
    depth: 1,
    limit: 1000,
    sort: "createdAt",
    overrideAccess: true,
  });
  return result.docs.map(publicProduct);
});

export const getProduct = cache(async (slug: string) => {
  if (!cmsConfigured()) return coffeeProducts.find((p) => p.slug === slug);
  const cms = await getCMS();
  const result = await cms.find({
    collection: "products",
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  });
  return result.docs[0] ? publicProduct(result.docs[0]) : undefined;
});
