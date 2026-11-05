import type { Metadata } from "next";
import ShopShell from "@/components/shop-shell";
import CheckoutForm from "@/components/checkout-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...pageMetadata("/finalizare-comanda", "Finalizare comandă | Makeon", "Datele de contact, livrarea și plata comenzii tale Makeon."), robots: { index: false, follow: false } };
export default function CheckoutPage() {
  return <ShopShell><CheckoutForm /></ShopShell>;
}
