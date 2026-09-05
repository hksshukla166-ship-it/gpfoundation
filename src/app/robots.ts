import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/settings";

export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${url}/sitemap.xml`,
  };
}
