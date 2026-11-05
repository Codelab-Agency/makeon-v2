import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";

test("public pages emit self canonicals, sharing metadata, entity data and one H1", async ({ request }) => {
  const titles = new Set<string>();
  for (const path of ["/", "/apa", "/cafea-pentru-birouri", "/prajitoria", "/cafea-la-evenimente", "/cafea"]) {
    const response = await request.get(path);
    expect(response.ok(),path).toBe(true);
    const html = await response.text();
    const canonical = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/)||[])[1];
    expect(new URL(canonical).href).toBe(new URL(path,"https://makeon.ro").href);
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('name="google-site-verification" content="BVPz6I0vRBJr7uB0WMoqJ898rGaLYvq6PHKNZomT7KU"');
    const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    expect((markup.match(/<h1\b/g)||[]).length,path).toBe(1);
    const graphs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
    expect(graphs.some(graph=>graph["@graph"]?.some((entity:{"@type":string})=>entity["@type"]==="Organization"))).toBe(true);
    titles.add((html.match(/<title>([\s\S]*?)<\/title>/)||[])[1]);
  }
  expect(titles.size).toBe(6);
});

test("www pages redirect permanently and share bots receive metadata in the head", async ({ request }) => {
  const redirect=await request.get('/cafea/intense?utm_source=test',{headers:{host:'www.makeon.ro'},maxRedirects:0});
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe('https://makeon.ro/cafea/intense?utm_source=test');
  const html=await request.get('/cafea/intense',{headers:{'User-Agent':'facebookexternalhit/1.1'}}).then(response=>response.text());
  const head=html.split('</head>')[0];
  expect(head).toContain('rel="canonical"');
  expect(head).toContain('property="og:image"');
});

test("products, prices and links are present without JavaScript and product schema matches the page", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled:false });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:3000/cafea");
    const cards = page.locator(".shop-product-card");
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first()).toBeVisible();
    await expect(cards.first().locator("button.shop-add")).toBeDisabled();
    const href = await cards.first().locator("a.shop-product-art").getAttribute("href");
    await page.goto(`http://localhost:3000${href}`);
    const graphs = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.textContent||"{}")));
    const product = graphs.find(graph=>graph["@type"]==="Product");
    expect(product.url).toBe(`https://makeon.ro${href}`);
    if(product.offers){expect(product.offers.priceCurrency).toBe("RON");expect(Number(product.offers.price)).toBeGreaterThan(0);}
    await expect(page.locator("h1")).toBeVisible();
  } finally { await context.close(); }
});

test("sitemap discovers active products and excludes checkout, API and draft policies", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
  const html=await request.get("/cafea").then(response=>response.text());
  const productPaths = [...new Set([...html.replace(/<script\b[\s\S]*?<\/script>/gi,"").matchAll(/href="(\/cafea\/[^"?#]+)"/g)].map(match=>match[1]))];
  expect(productPaths.length).toBeGreaterThan(0);
  for(const path of productPaths)expect(urls).toContain(`https://makeon.ro${path}`);
  expect(new Set(urls).size).toBe(urls.length);
  expect(xml).not.toMatch(/finalizare-comanda|politica-de-|termeni-si-conditii|\/api\/|\/admin/);
  expect(xml).toContain("<lastmod>");
  const robots=await request.get("/robots.txt").then(response=>response.text());
  expect(robots).toContain("Sitemap: https://makeon.ro/sitemap.xml");
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Disallow: /api/");
  expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  for(const path of ["/termeni-si-conditii","/politica-de-confidentialitate","/politica-de-cookie-uri","/finalizare-comanda"]){
    const html=await request.get(path).then(response=>response.text());
    expect(html).toMatch(/name="robots" content="noindex/);
  }
});

test("server-rendered browsing stays visible while purchase controls wait for the live catalog", async ({ page }) => {
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route("**/api/catalog",async route=>{
    await held;
    await route.fulfill({json:{products:coffeeProducts.map(product=>({...product,price:49.99,stock:5})),managed:true,checkout:true,cod:true,easybox:false,shippingBani:2500}});
  });
  await page.goto("/cafea",{waitUntil:"domcontentloaded"});
  const add=page.locator(".shop-product-card button.shop-add").first();
  await expect(add).toBeVisible();await expect(add).toBeDisabled();
  release();
  await expect(add).toBeEnabled();
});
