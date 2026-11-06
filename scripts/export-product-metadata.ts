import fs from "node:fs/promises";
import path from "node:path";
import { getCMS } from "../src/lib/cms";
import { publicProduct } from "../src/lib/storefront";
import { merchantExclusion } from "../src/lib/google-merchant-feed";
import { productBrand } from "../src/lib/product-identifiers";
import { absoluteUrl } from "../src/lib/seo";

// Read-only reference for the Merchant Center operator. Use the live XML feed
// as the Google data source, rather than this dated inventory snapshot.
const target=path.resolve(process.argv[2] || "artifacts/produse-google-metadata.csv");
const cms=await getCMS();
try {
  const headers=["sku","name","slug","active","google_enabled","feed_status","brand","gtin","mpn","identifiers_absent","price_ron","available_stock","grams","unit_label","url","image_url","description"];
  const rows: unknown[][]=[headers];
  let page=1,hasNextPage=true;
  while(hasNextPage) {
    const result=await cms.find({collection:"products",limit:100,depth:1,page,sort:"id",overrideAccess:true});
    for(const doc of result.docs) {
      const p=publicProduct(doc);
      rows.push([p.sku,p.name,p.slug,Boolean(doc.active),p.googleEnabled!==false,!doc.active?"inactive":merchantExclusion(p)||"included",
        productBrand(p),p.gtin,p.mpn,Boolean(p.identifiersAbsent),p.price?.toFixed(2),p.stock,p.grams,p.unitLabel,
        absoluteUrl(`/cafea/${p.slug}`),p.imageOriginalUrl||p.imageUrl,p.description]);
    }
    hasNextPage=result.hasNextPage;page++;
  }
  const cell=(value:unknown)=>{
    let text=value==null?"":String(value);
    if(/^[\s]*[=+@-]/.test(text))text=`'${text}`; // Safe to inspect in a spreadsheet.
    return `"${text.replaceAll('"','""')}"`;
  };
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,"\ufeff"+rows.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n","utf8");
  console.log(`Exported ${rows.length-1} products to ${target}`);
} finally { await cms.destroy(); }
process.exit(0);
