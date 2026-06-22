import type { MetadataRoute } from "next";
import { getLiveMatches } from "@/lib/api/cricapi";
import { playerCatalog, teamCatalog } from "@/lib/data/searchCatalog";
import { absoluteUrl, siteBaseUrl } from "@/lib/seo/canonical";
import { seriesSlugFromLeague } from "@/lib/utils/series";

export async function collectSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = siteBaseUrl();

  const entries: MetadataRoute.Sitemap = [
    {
      url: base + "/",
      lastModified: now,
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: base + "/schedule",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
  ];

  for (const t of teamCatalog) {
    entries.push({
      url: absoluteUrl(`/team/${encodeURIComponent(t.id)}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.78,
    });
  }

  for (const p of playerCatalog) {
    entries.push({
      url: absoluteUrl(`/player/${encodeURIComponent(p.id)}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.66,
    });
  }

  try {
    const live = await getLiveMatches();
    const seriesSlugs = new Set<string>();
    if (live.ok && live.data?.length) {
      for (const m of live.data) {
        const id = m.id?.trim();
        if (!id) continue;
        entries.push({
          url: absoluteUrl(`/match/${encodeURIComponent(id)}`),
          lastModified: now,
          changeFrequency: "always",
          priority: 0.92,
        });
        if (m.league?.trim()) {
          seriesSlugs.add(seriesSlugFromLeague(m.league));
        }
      }
    }
    for (const slug of seriesSlugs) {
      if (!slug) continue;
      entries.push({
        url: absoluteUrl(`/series/${encodeURIComponent(slug)}`),
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    /* sitemap remains useful without live rows */
  }

  return entries;
}
