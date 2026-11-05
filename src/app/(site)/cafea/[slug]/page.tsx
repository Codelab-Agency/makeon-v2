import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CoffeeDetail from "@/components/coffee-detail";
import ShopShell from "@/components/shop-shell";
import { getProduct } from "@/lib/storefront";
import { pageMetadata, productTitle, productGraph, breadcrumbGraph } from "@/lib/seo";
import StructuredData from "@/components/structured-data";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? pageMetadata(`/cafea/${p.slug}`, productTitle(p), p.description, p.imageUrl)
    : { title: "Produs negăsit | Makeon", robots: { index: false, follow: true } };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  return (
    <ShopShell>
      <StructuredData data={productGraph(p)} />
      <StructuredData data={breadcrumbGraph([{name:"Makeon",path:"/"},{name:"Magazin cafea",path:"/cafea"},{name:p.name,path:`/cafea/${p.slug}`}])} />
      <CoffeeDetail product={p} />
    </ShopShell>
  );
}
