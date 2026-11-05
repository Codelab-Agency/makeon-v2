import { getProducts } from "@/lib/storefront";
import { easyboxConfigured, deliveryPriceBani } from "@/lib/easybox";
import { checkoutConfigured, cmsConfigured, ordersConfigured } from "@/lib/commerce-env";
import { getCMS } from "@/lib/cms";
import { reconcileExpired, stripeClient, pruneAbandonedCheckouts } from "@/lib/commerce";

export const dynamic = "force-dynamic";

/** Log database error codes, never SQL parameters, connection strings or customer data. */
function failureDetails(error: unknown) {
  const details: Record<string, string>[] = [];
  const seen = new Set<unknown>();
  while (error && typeof error === "object" && !seen.has(error) && details.length < 5) {
    seen.add(error);
    const current = error as Record<string, unknown>;
    const detail: Record<string, string> = {};
    for (const key of ["name", "code", "table", "column", "constraint"]) {
      const value = current[key];
      if (typeof value === "string" && /^[A-Za-z0-9_]{1,80}$/.test(value)) detail[key] = value;
    }
    details.push(detail);
    error = current.cause;
  }
  return details;
}

export async function GET() {
  try {
    // Recover inventory even when an expiration webhook was missed and no
    // remaining stock is available to start another checkout.
    try {
      if (checkoutConfigured())
        await reconcileExpired(await getCMS(), stripeClient());
      else if (cmsConfigured()) await pruneAbandonedCheckouts(await getCMS());
    } catch (error) {
      // Sellable stock already excludes reservations. Failed maintenance may
      // temporarily understate availability, but must not hide the catalog.
      console.error("Catalog reservation reconciliation failed; reservations remain held.", failureDetails(error));
    }
    let easybox=false,easyboxShippingBani:number|null=null;
    if(ordersConfigured() && easyboxConfigured()){
      try{easyboxShippingBani=deliveryPriceBani("easybox");easybox=true;}
      catch{console.error("Easybox shipping rate is invalid; address delivery remains available.");}
    }
    return Response.json(
      {
        products: await getProducts(),
        managed: cmsConfigured(),
        checkout: checkoutConfigured(),
        cod: ordersConfigured(),
        easybox,
        easyboxShippingBani,
        shippingBani: ordersConfigured()
          ? Number(process.env.SHIPPING_PRICE_BANI)
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Catalog load failed", failureDetails(error));
    return Response.json(
      { error: "Catalogul este temporar indisponibil." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
