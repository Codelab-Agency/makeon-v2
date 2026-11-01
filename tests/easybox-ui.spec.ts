import { test, expect } from "@playwright/test";
import { coffeeProducts } from "../src/lib/coffee-catalog";

for (const {width, request} of [{width:320, request:false}, {width:390, request:false}, {width:1440, request:false}, {width:390, request:true}]) {
  test(`easybox selection, billing and delivery fee survive ${request ? "made-to-order request" : "checkout"} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/catalog", route => route.fulfill({ json: {
      products: coffeeProducts.map(p => ({ ...p, price: 50, stock: request ? 0 : 5 })),
      managed: true, checkout: true, cod: true, shippingBani: 2500,
      easybox: true, easyboxShippingBani: 1800,
    } }));
    const locker = { id: 1413, name: "easybox Test", address: "Strada Locker 12", city: "București", county: "București", postalCode: "010101", supportedPayment: true };
    await page.route("**/api/shipping/easybox", route => route.fulfill({ json:
      route.request().method() === "GET" ? { clientId: "test-client", apiUsername: "test-map-user" } : { locker },
    }));
    await page.route("https://cdn.sameday.ro/locker-plugin/lockerpluginsdk.js", route => route.fulfill({ contentType: "application/javascript", body: `
      let callback;
      const instance = {
        subscribe: cb => callback = cb,
        reinitializePlugin: options => window.mapOptions = options,
        close: () => document.getElementById('mock-map')?.remove(),
        open: () => {
          document.querySelector('meta[name="viewport"]').content = 'user-scalable=no';
          const button = document.createElement('button');
          button.id = 'mock-map'; button.textContent = 'Selectează easybox Test';
          button.onclick = () => callback({ lockerId: 1413, oohType: 0 });
          document.body.appendChild(button);
        }
      };
      window.LockerPlugin = { init: () => {}, getInstance: () => instance };
    ` }));
    await page.addInitScript(() => localStorage.setItem("makeon-coffee-cart-v1", JSON.stringify([{ slug: "intense", grind: "Boabe", quantity: 2 }])));
    let submitted: any;
    await page.route(request ? "**/api/orders/request" : "**/api/checkout", async route => {
      submitted = route.request().postDataJSON();
      await route.fulfill({ json: { reference: "MK-easybox-test", paymentMethod: "cod" } });
    });
    await page.goto("/finalizare-comanda");
    const form = page.locator(request ? "main .production-request-form" : ".checkout-form");
    const submit = form.getByRole("button", { name: request ? "Înregistrează comanda" : "Trimite comanda" });
    await form.getByLabel("Nume și prenume", { exact: false }).fill("Client Test");
    await form.getByLabel("Telefon", { exact: false }).fill("+40744123456");
    await form.getByLabel("E-mail", { exact: false }).fill("client@example.test");
    await form.getByLabel("Stradă, număr, bloc, apartament", { exact: false }).fill("Strada Facturare 10");
    await form.getByLabel("Județ / sector", { exact: false }).fill("Cluj");
    await form.getByLabel("Localitate", { exact: false }).fill("Cluj-Napoca");
    await form.getByRole("radio", { name: "La easybox", exact: false }).check();
    if (!request) await expect(page.getByRole("complementary", { name: "Rezumat comandă" })).toContainText("118,00");
    await form.getByRole("radio", { name: "La adresă", exact: false }).check();
    if (!request) await expect(page.getByRole("complementary", { name: "Rezumat comandă" })).toContainText("125,00");
    await form.getByRole("radio", { name: "La easybox", exact: false }).check();
    await form.getByRole("radio", { name: "Ramburs", exact: false }).check();
    await form.getByRole("checkbox").check();
    await submit.click();
    await expect(form.getByRole("alert")).toContainText("easybox");
    expect(submitted).toBeUndefined();
    await form.getByRole("button", { name: "Alege easyboxul pe hartă" }).click();
    await page.getByRole("button", { name: "Selectează easybox Test" }).click();
    await expect(form.getByRole("status")).toContainText("Strada Locker 12");
    expect(await page.locator('meta[name="viewport"]').getAttribute("content")).not.toContain("user-scalable=no");
    expect(await page.evaluate(() => (window as any).mapOptions.filters)).toEqual([{ showLockers: true }, { showPudos: false }]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await submit.click();
    await expect(page.locator("main")).toContainText("MK-easybox-test");
    expect(submitted.details.shipping.method).toBe("easybox");
    expect(submitted.details.shipping.locker).toEqual(locker);
    expect(submitted.details.billing.address).toContain("Strada Facturare 10");
    expect(submitted.details.billing.address).not.toContain("Locker");
    expect(submitted.details.paymentMethod).toBe("cod");
  });
}
