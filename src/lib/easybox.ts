import "server-only";
import { parseCheckoutDetails, type CheckoutDetails } from "./checkout-details";
import { CommerceError } from "./commerce-validation";
import { samedayLocker } from "./sameday-client";

export function easyboxConfigured() {
  return process.env.SAMEDAY_ENV === "production" && Boolean(process.env.SAMEDAY_USERNAME?.trim() && process.env.SAMEDAY_PASSWORD?.trim() && process.env.SAMEDAY_LOCKER_CLIENT_ID?.trim() && process.env.SAMEDAY_LOCKER_API_USERNAME?.trim());
}

export function deliveryPriceBani(method?: string) {
  const raw = method === "easybox" && process.env.EASYBOX_SHIPPING_PRICE_BANI?.trim()
    ? process.env.EASYBOX_SHIPPING_PRICE_BANI : process.env.SHIPPING_PRICE_BANI;
  const price = Number(raw);
  if (!/^\d+$/.test(raw ?? "") || !Number.isSafeInteger(price) || price < 0 || price > 99999999) throw new CommerceError("Tariful de livrare nu este disponibil momentan.", 503);
  return price;
}

export async function validateEasyboxDetails(details: CheckoutDetails, fetcher: typeof fetch = fetch) {
  if (details.shipping.method !== "easybox") return details;
  if (!easyboxConfigured()) throw new CommerceError("Livrarea la easybox nu este disponibilă momentan. Alege livrarea la adresă.", 503);
  try {
    const locker = await samedayLocker(details.shipping.locker!.id, fetcher);
    if (details.paymentMethod === "cod" && !locker.supportedPayment) throw new CommerceError("Easyboxul ales nu acceptă plata la ridicare. Alege alt easybox sau plata online.", 409);
    return parseCheckoutDetails({ ...details, shipping: { ...details.shipping, locker } });
  } catch(error) {
    if (error instanceof CommerceError) throw error;
    throw new CommerceError(error instanceof Error ? error.message : "Easyboxul nu a putut fi verificat. Încearcă din nou.", 503);
  }
}
