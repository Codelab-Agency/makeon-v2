import { test, expect } from "@playwright/test";

test("Google Merchant XML parses and matches the live product pages, including shipping and availability", async ({page, request})=>{
  const response=await request.get('/google-merchant.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/xml');
  expect(response.headers()['x-robots-tag']).toBe('noindex');
  const xml=await response.text();
  const feed=await page.evaluate(xml=>{
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    return {errors:doc.querySelectorAll('parsererror').length,items:Array.from(doc.querySelectorAll('item')).map(item=>{
      const value=(name:string)=>item.getElementsByTagNameNS('http://base.google.com/ns/1.0',name)[0]?.textContent;
      const shipping=item.getElementsByTagNameNS('http://base.google.com/ns/1.0','shipping')[0];
      return {id:value('id'),link:value('link'),image:value('image_link'),price:value('price'),availability:value('availability'),
        shipping:shipping?.getElementsByTagNameNS('http://base.google.com/ns/1.0','price')[0]?.textContent};
    })};
  },xml);
  expect(feed.errors).toBe(0);expect(feed.items.length).toBeGreaterThan(0);
  expect(new Set(feed.items.map(item=>item.id)).size).toBe(feed.items.length);
  for(const item of feed.items){
    expect(item.image).toMatch(/^https:\/\//);
    expect(item.price).toMatch(/^\d+\.\d{2} RON$/);
    const path=new URL(item.link!).pathname;
    const html=await request.get(path).then(response=>response.text());
    const graphs=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
    const product=graphs.find(graph=>graph['@type']==='Product');
    expect(`${product.offers.price} ${product.offers.priceCurrency}`).toBe(item.price);
    expect(product.offers.availability).toBe(`https://schema.org/${item.availability==='in_stock'?'InStock':'OutOfStock'}`);
    expect(product.image).toContain(item.image);
    expect(`${product.offers.shippingDetails.shippingRate.value} RON`).toBe(item.shipping);
  }
});
