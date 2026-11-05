import ShopShell from "@/components/shop-shell";
import CheckoutResult from "@/components/checkout-result";
import { stripeClient, applySession } from "@/lib/commerce";
import { checkoutConfigured } from "@/lib/commerce-env";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = {
  ...pageMetadata("/comanda", "Comanda ta | Makeon", "Confirmarea și statusul comenzii tale Makeon."),
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string;
    anulata?: string;
    la_cerere?: string;
  }>;
}) {
  const params = await searchParams;
  let paid = false,
    production = params.la_cerere === "1",
    reference: string | undefined;
  if (
    checkoutConfigured() &&
    /^cs_(test_|live_)?[A-Za-z0-9]+$/.test(params.session_id ?? "")
  ) {
    try {
      // Redirect parameters are not payment proof. Fetch Stripe's session server-side
      // and reconcile through the webhook's shared path before showing success.
      const session = await stripeClient().checkout.sessions.retrieve(
        params.session_id!,
      );
      const order = await applySession(session);
      paid = order?.status === "paid";
      if (order) production = order.orderType === "production";
      if (paid) reference = order?.reference;
    } catch {
      /* A webhook retry will reconcile a transient failure. */
    }
  }
  return (
    <ShopShell>
      <CheckoutResult
        paid={paid}
        reference={reference}
        cancelled={params.anulata === "1"}
        production={production}
      />
    </ShopShell>
  );
}
