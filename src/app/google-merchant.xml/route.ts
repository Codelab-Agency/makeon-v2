import { buildMerchantFeed } from "@/lib/google-merchant-feed";
import { getProducts } from "@/lib/storefront";
import { ordersConfigured } from "@/lib/commerce-env";
import { deliveryPriceBani } from "@/lib/easybox";
import { previewDeployment } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function GET() {
  if (previewDeployment()) return new Response("Not found", {status:404, headers});
  try {
    if (!ordersConfigured()) throw new Error("Commerce configuration missing");
    const feed = buildMerchantFeed(await getProducts(), deliveryPriceBani());
    if (feed.excluded.length) console.warn("Merchant feed excluded products", feed.excluded.map(item=>({slug:item.slug,reason:item.reason})));
    return new Response(feed.xml, {headers:{...headers,"Content-Type":"application/xml; charset=utf-8","X-Makeon-Feed-Items":String(feed.count)}});
  } catch {
    console.error("Merchant feed unavailable; check CMS and shipping configuration.");
    return Response.json({error:"Catalogul pentru Google nu este disponibil momentan."},{status:503,headers});
  }
}
