import { mainPageMetadata, absoluteUrl, breadcrumbGraph } from "@/lib/seo";
import { getProducts } from "@/lib/storefront";
import StructuredData from "@/components/structured-data";
import CoffeeShop from "@/components/coffee-shop";
import ShopShell from "@/components/shop-shell";

export const dynamic = "force-dynamic";
export const metadata = mainPageMetadata("/cafea");
export default async function CoffeeStore() {
  const products = await getProducts();
  return (
    <ShopShell>
      <StructuredData data={breadcrumbGraph([{name:"Makeon",path:"/"},{name:"Magazin cafea",path:"/cafea"}])} />
      <StructuredData data={{"@context":"https://schema.org","@type":"CollectionPage",name:"Magazin Makeon · Cafea și accesorii",url:absoluteUrl("/cafea"),mainEntity:{"@type":"ItemList",numberOfItems:products.length,itemListElement:products.map((product,index)=>({"@type":"ListItem",position:index+1,name:product.name,url:absoluteUrl(`/cafea/${product.slug}`)}))}}} />
      <div className="shop-banner section-padding">
        <span className="eyebrow">
          PENTRU BIROU. PENTRU ACASĂ. PENTRU TINE.
        </span>
        <h1>
          Un ritual bun
          <br />
          <span>merită dus acasă.</span>
        </h1>
        <p>Cafeaua pe care o iubești, dincolo de pauza de la birou.</p>
      </div>
      <CoffeeShop full initialProducts={products} />
    </ShopShell>
  );
}
