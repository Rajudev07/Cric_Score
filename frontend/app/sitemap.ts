import type { MetadataRoute } from "next";
import { collectSitemapEntries } from "@/lib/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return collectSitemapEntries();
}
