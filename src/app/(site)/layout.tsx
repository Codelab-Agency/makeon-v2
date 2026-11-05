import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "lenis/dist/lenis.css";
import "../smooth-scroll.css";
import "../globals.css";
import "../elements.css";
import "../shop.css";
import "../services.css";
import "../interface.css";
import "../navigation.css";
import "../overlays.css";
import "../mobile.css";
import "../cinematic.css";
import "../events.css";
import "../commerce.css";
import "../legal.css";
import "../typography.css";
import "../layout-spacing.css";
import "../business.css";
import "../home.css";
import "../home-support.css";
import "../service-compositions.css";
import "../presentation-motion.css";
import "../office-offers.css";
import "../opening.css";
import "../office-service-pages.css";
import "../disclosures.css";
import "../offer-dialog.css";
import "../interface-polish.css";
import "../event-photo-pair.css";
import "../service-editorial.css";
import "../site-choreography.css";
import "../media-frames.css";
import "../water-page.css";
import "../home-business.css";
import CartProvider from "@/components/cart-provider";
import CatalogProvider from "@/components/catalog-provider";
import SmoothScroll from "@/components/smooth-scroll";

export const metadata: Metadata = {
  title: "Makeon — Cafea, apă și echipamente pentru companii",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  description:
    "Cafea SwitchMORN, espressoare și apă Vero Aqua pentru birouri. Echipamente, aprovizionare, filtrare și cafea la evenimente. Solicită ofertă.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" data-scroll-behavior="smooth">
      <body>
        <SmoothScroll />
        <CatalogProvider>
          <CartProvider>{children}</CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
