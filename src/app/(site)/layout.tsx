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
import "../art-direction.css";
import CartProvider from "@/components/cart-provider";
import CatalogProvider from "@/components/catalog-provider";
import SmoothScroll from "@/components/smooth-scroll";
import StructuredData from "@/components/structured-data";
import { mainPageMetadata, organizationGraph, previewDeployment, site } from "@/lib/seo";

export const metadata: Metadata = {
  ...mainPageMetadata("/"),
  metadataBase: new URL(site.url),
  applicationName: site.name,
  verification: { google: site.googleVerification },
  robots: previewDeployment() ? { index: false, follow: false } : {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" data-scroll-behavior="smooth">
      <body>
        <StructuredData data={organizationGraph()} />
        <SmoothScroll />
        <CatalogProvider>
          <CartProvider>{children}</CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
