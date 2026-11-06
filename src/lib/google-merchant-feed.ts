import type { CoffeeProduct } from "./coffee-catalog";
import { categoryLabel } from "./coffee-catalog";
import { absoluteUrl, site } from "./seo";
import { packageLabel } from "./product-format";
import { productBrand, validGtin } from "./product-identifiers";

export function escapeXml(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[char]!);
}
const plain = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function productImage(product: CoffeeProduct) {
  const raw = product.imageOriginalUrl || product.imageUrl;
  if (!raw) return undefined;
  try {
    const url = new URL(raw, site.url);
    return ["http:","https:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function merchantExclusion(product: CoffeeProduct) {
  if (product.googleEnabled === false) return "disabled";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || product.slug.length > 50) return "invalid_id";
  if (!Number.isFinite(product.price) || product.price == null || product.price <= 0 || Math.abs(product.price * 100 - Math.round(product.price * 100)) > 0.00001) return "missing_price";
  if (!Number.isSafeInteger(product.stock) || product.stock! < 0) return "unknown_stock";
  if (!plain(product.name) || !plain(product.description)) return "missing_description";
  if (!productImage(product)) return "missing_image";
  if (product.gtin && !validGtin(product.gtin)) return "invalid_gtin";
  if (product.identifiersAbsent && (product.gtin || product.mpn)) return "conflicting_identifiers";
  return null;
}

/** Live, complete RSS 2.0 source. Never turn an unknown price into a free offer. */
export function buildMerchantFeed(products: CoffeeProduct[], shippingBani: number) {
  if (!Number.isSafeInteger(shippingBani) || shippingBani < 0 || shippingBani > 99999999) throw new Error("Invalid merchant shipping rate");
  const excluded: {slug: string; reason: string}[] = [];
  const items: string[] = [];
  const tag = (name: string, value: string) => `<g:${name}>${escapeXml(value)}</g:${name}>`;
  for (const product of products) {
    const reason = merchantExclusion(product);
    if (reason) { excluded.push({slug: product.slug, reason}); continue; }
    const brand = productBrand(product);
    const title = [brand, product.name, packageLabel(product), categoryLabel(product.category)].filter(Boolean).join(" · ").replace(/\s+/g," ").trim().slice(0, 150);
    items.push(`<item>\n${[
      tag("id", product.slug), tag("title", title), tag("description", plain(product.description).slice(0, 5000)),
      tag("link", absoluteUrl(`/cafea/${product.slug}`)), tag("image_link", productImage(product)!),
      tag("availability", product.stock! > 0 ? "in_stock" : "out_of_stock"),
      tag("price", `${product.price!.toFixed(2)} RON`), tag("condition", "new"),
      ...(brand ? [tag("brand", brand)] : []),
      ...(product.gtin ? [tag("gtin", product.gtin)] : []),
      ...(product.mpn ? [tag("mpn", product.mpn.trim())] : []),
      ...(product.identifiersAbsent ? [tag("identifier_exists", "no")] : []),
      tag("product_type", `Makeon > ${categoryLabel(product.category)}`),
      ...(product.category !== "complementare" && product.grams && product.grams > 0 ? [
        tag("unit_pricing_measure", `${product.grams / 1000} kg`), tag("unit_pricing_base_measure", "1 kg"),
      ] : []),
      `<g:shipping>${tag("country", "RO")}${tag("service", "Sameday la adresă")}${tag("price", `${(shippingBani / 100).toFixed(2)} RON`)}</g:shipping>`,
    ].join("\n")}\n</item>`);
  }
  return {
    count: items.length, excluded,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>\n<title>Makeon · Produse</title><link>${escapeXml(absoluteUrl("/cafea"))}</link><description>Produse Makeon, prețuri și disponibilitate actualizate din magazin.</description>\n${items.join("\n")}\n</channel></rss>\n`,
  };
}
