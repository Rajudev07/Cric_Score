import type { MetadataRoute } from "next";
import { robotsHost, robotsSitemapUrl } from "@/lib/seo/indexing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/~offline", "/ops"],
      },
    ],
    sitemap: robotsSitemapUrl(),
    host: robotsHost(),
  };
}
