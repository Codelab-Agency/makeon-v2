import type { MetadataRoute } from "next";
import { absoluteUrl, previewDeployment, seoPages } from "@/lib/seo";
import { getProducts } from "@/lib/storefront";
import { legal } from "@/lib/legal";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (previewDeployment()) return [];
  // Propagate catalog outages rather than publish a successful but incomplete product sitemap.
  const products = await getProducts();
  const paths = [...Object.keys(seoPages), legal.returns, ...(!legal.draft ? [legal.terms, legal.privacy, legal.cookies] : [])];
  return [
    ...paths.map(path => ({ url: absoluteUrl(path) })),
    ...products.map(product => ({ url: absoluteUrl(`/cafea/${product.slug}`),
      ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
      ...(product.imageUrl ? { images: [absoluteUrl(product.imageUrl)] } : {}),
    })),
  ];
}
