import { test } from "node:test";
import assert from "node:assert/strict";
import { coffeeProducts } from "../../src/lib/coffee-catalog";
import { mainPageMetadata, pageMetadata, productTitle, productGraph, serializeJsonLd, seoPages } from "../../src/lib/seo";
import robots from "../../src/app/robots";
import { GET as llms } from "../../src/app/llms.txt/route";
import nextConfig from "../../next.config.mjs";

test("indexable pages have distinct, absolute canonicals and complete sharing metadata", () => {
  const titles = new Set<string>();
  for (const path of Object.keys(seoPages) as (keyof typeof seoPages)[]) {
    const meta = mainPageMetadata(path);
    assert.equal(meta.alternates?.canonical, new URL(path,"https://makeon.ro").href);
    assert.equal((meta.openGraph as {url:string}).url, meta.alternates?.canonical);
    assert.ok(meta.description && meta.description.length <= 165);
    assert.ok(meta.twitter);titles.add(String(meta.title));
  }
  assert.equal(titles.size,Object.keys(seoPages).length);
  assert.ok(pageMetadata('/cafea/test','Test','Lung '.repeat(100)).description!.length<=165);
});

test("product schema uses actual prices and inventory, without invented free prices, reviews or brands", () => {
  const base={...coffeeProducts[0],price:49.99,stock:5};
  assert.equal(productGraph(base).offers?.price,'49.99');
  assert.equal(productGraph(base).offers?.availability,'https://schema.org/InStock');
  assert.equal(productGraph({...base,stock:0}).offers?.availability,'https://schema.org/BackOrder');
  assert.equal(productGraph({...base,price:null}).offers,undefined);
  assert.equal(productGraph({...base,price:0}).offers,undefined);
  assert.equal(productGraph({...base,stock:undefined}).offers?.availability,undefined);
  assert.equal(productGraph({...base,category:'complementare',grams:null,unitLabel:'Set de 6'}).brand,undefined);
  assert.ok(!JSON.stringify(productGraph(base)).includes('aggregateRating'));
  const title=productTitle({...base,category:'complementare',grams:null,unitLabel:'Set de 6'});
  assert.ok(title.includes('Set de 6'));assert.ok(!title.includes('null'));assert.ok(!title.includes('SwitchMORN'));
});

test("structured data escapes script boundaries while preserving the original product text", () => {
  const data={name:'Cafea </script><script>alert(1)</script>\u2028& test'};
  const serialized=serializeJsonLd(data);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized),data);
});

test("search and AI crawlers can access public pages; preview deployments disallow crawling", () => {
  const previous=process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV='production';
    assert.deepEqual(robots().rules,{userAgent:'*',allow:'/',disallow:['/admin','/api/','/finalizare-comanda','/comanda']});
    assert.equal(robots().sitemap,'https://makeon.ro/sitemap.xml');
    process.env.VERCEL_ENV='preview';
    assert.deepEqual(robots().rules,{userAgent:'*',disallow:'/'});
  } finally { if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous; }
});

test("the optional AI navigation summary links to real pages and does not claim to replace the catalog", async () => {
  const response=llms();const text=await response.text();
  assert.equal(response.headers.get('x-robots-tag'),'noindex');
  for(const path of Object.keys(seoPages))assert.ok(text.includes(new URL(path,'https://makeon.ro').href));
  assert.ok(!text.includes('alcalinizare'));assert.ok(!text.includes('mineralizare'));
});

test("canonical redirects cover public pages while leaving payment APIs and webhooks untouched", async () => {
  const redirects=await nextConfig.redirects!();
  assert.ok(redirects.some((rule:{source:string})=>rule.source==='/cafea/:path*'));
  assert.ok(redirects.every((rule:{source:string})=>!rule.source.includes('/api')&&!rule.source.includes('/admin')));
});
