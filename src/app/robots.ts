import type { MetadataRoute } from "next";
import { absoluteUrl, previewDeployment } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: previewDeployment() ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/finalizare-comanda", "/comanda"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
