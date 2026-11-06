import { test } from "node:test";
import assert from "node:assert/strict";
import { coffeeProducts } from "../../src/lib/coffee-catalog";
import { buildMerchantFeed, merchantExclusion } from "../../src/lib/google-merchant-feed";
import { validGtin, gtinSchemaFields } from "../../src/lib/product-identifiers";
import { productGraph } from "../../src/lib/seo";
import { GET } from "../../src/app/google-merchant.xml/route";

const product={...coffeeProducts[0],stock:5,price:49.99,imageUrl:'https://cdn.example.com/card.webp',imageOriginalUrl:'https://cdn.example.com/original.webp'};

test('stored SKU remains the same feed and structured-data ID after renaming the product or changing its URL',()=>{
  const original={...product,sku:'MKN-000001'};
  const renamed={...original,slug:'another-url',name:'Another name'};
  for(const item of [original,renamed]) {
    assert.ok(buildMerchantFeed([item],2500).xml.includes('<g:id>MKN-000001</g:id>'));
    assert.equal(productGraph(item).sku,'MKN-000001');
    assert.ok(!buildMerchantFeed([item],2500).xml.includes('<g:mpn>'));
  }
  assert.equal(merchantExclusion({...original,sku:'bad sku'}),'invalid_id');
});

test('Merchant XML safely encodes real product, original image, pack size, VAT-inclusive price and configured shipping',()=>{
  const feed=buildMerchantFeed([{...product,name:'Cafea & <special>',description:'Cafea <b>proaspătă</b> & gust bun\u0001'}],2500);
  assert.equal(feed.count,1);assert.deepEqual(feed.excluded,[]);
  assert.ok(feed.xml.includes('xmlns:g="http://base.google.com/ns/1.0"'));
  assert.ok(feed.xml.includes('Cafea &amp; &lt;special&gt;'));
  assert.ok(feed.xml.includes('<g:description>Cafea proaspătă &amp; gust bun</g:description>'));
  assert.ok(!feed.xml.includes('\u0001'));
  assert.ok(feed.xml.includes('<g:image_link>https://cdn.example.com/original.webp</g:image_link>'));
  assert.ok(feed.xml.includes('<g:price>49.99 RON</g:price>'));
  assert.ok(feed.xml.includes('<g:price>25.00 RON</g:price>'));
  assert.ok(feed.xml.includes('<g:country>RO</g:country>'));
  assert.ok(feed.xml.includes('<g:unit_pricing_measure>0.5 kg</g:unit_pricing_measure>'));
  assert.ok(feed.xml.includes('<g:unit_pricing_base_measure>1 kg</g:unit_pricing_base_measure>'));
});

test('only sellable priced products with photos and known inventory enter the feed; zero stock is not a dated backorder',()=>{
  const variants=[{...product,price:null},{...product,price:0},{...product,imageUrl:undefined,imageOriginalUrl:undefined},
    {...product,stock:undefined},{...product,googleEnabled:false}];
  for(const variant of variants)assert.ok(merchantExclusion(variant));
  const feed=buildMerchantFeed([{...product,stock:0},...variants],1800);
  assert.equal(feed.count,1);assert.equal(feed.excluded.length,variants.length);
  assert.ok(feed.xml.includes('<g:availability>out_of_stock</g:availability>'));
  assert.ok(!feed.xml.includes('<g:availability_date>'));
  assert.equal(productGraph({...product,stock:0}).offers?.availability,'https://schema.org/OutOfStock');
  assert.throws(()=>buildMerchantFeed([product],Number.NaN));
  assert.throws(()=>buildMerchantFeed([product],-100));
});

test('GTINs preserve leading zeroes and validate the check digit; unknown identifiers are not declared nonexistent',()=>{
  for(const gtin of ['96385074','036000291452','5901234123457','00012345600012'])assert.ok(validGtin(gtin),gtin);
  for(const gtin of ['00000000','5901234123458','5901234','A901234123457'])assert.equal(validGtin(gtin),false,gtin);
  assert.deepEqual(gtinSchemaFields('036000291452'),{gtin12:'036000291452'});
  assert.ok(!buildMerchantFeed([product],2500).xml.includes('identifier_exists'));
  assert.ok(buildMerchantFeed([{...product,identifiersAbsent:true}],2500).xml.includes('<g:identifier_exists>no</g:identifier_exists>'));
  const identified={...product,gtin:'5901234123457',mpn:'Actual-code'};
  const xml=buildMerchantFeed([identified],2500).xml;
  assert.ok(xml.includes('<g:gtin>5901234123457</g:gtin>'));
  assert.ok(xml.includes('<g:mpn>Actual-code</g:mpn>'));
  assert.ok(!xml.includes('identifier_exists'));
  assert.equal(productGraph(identified).gtin13,'5901234123457');
  assert.equal(merchantExclusion({...identified,identifiersAbsent:true}),'conflicting_identifiers');
});

test('accessories retain their actual brand or no brand, and structured shipping matches the feed charge',()=>{
  const accessory={...product,category:'complementare' as const,grams:null,unitLabel:'Set de 6'};
  assert.ok(!buildMerchantFeed([accessory],2500).xml.includes('<g:brand>'));
  assert.ok(!buildMerchantFeed([accessory],2500).xml.includes('unit_pricing_measure'));
  assert.ok(buildMerchantFeed([{...accessory,brand:'Producător real'}],2500).xml.includes('<g:brand>Producător real</g:brand>'));
  assert.equal(productGraph({...accessory,brand:'Producător real'},2500).brand?.name,'Producător real');
  const shipping=productGraph(product,2500).offers?.shippingDetails;
  assert.equal(shipping?.shippingRate.value,'25.00');assert.equal(shipping?.shippingRate.currency,'RON');
  assert.equal(productGraph(product,-1).offers?.shippingDetails,undefined);
});

test('preview or unconfigured feeds fail without publishing static prices or a false empty success',async()=>{
  const previous={VERCEL_ENV:process.env.VERCEL_ENV,DATABASE_URL:process.env.DATABASE_URL};
  try{
    process.env.VERCEL_ENV='preview';assert.equal((await GET()).status,404);
    process.env.VERCEL_ENV='production';delete process.env.DATABASE_URL;
    const response=await GET();assert.equal(response.status,503);assert.equal(response.headers.get('x-robots-tag'),'noindex');
    assert.ok(!(await response.text()).includes('<rss'));
  }finally{for(const [name,value] of Object.entries(previous)){if(value===undefined)delete process.env[name];else process.env[name]=value;}}
});
