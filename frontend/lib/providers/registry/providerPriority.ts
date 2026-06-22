import { getFederationTrustBias, getScraperPriorityScore } from "@/lib/providers/federation/ingestSelfHeal";

/** Live list merge order (first = preferred when richness ties). */
export const LIVE_FEED_PROVIDER_ORDER = ["cricbuzz-scraper", "cricketdata"] as const;

/** Match detail enrichment order. */
export const DETAIL_PROVIDER_ORDER = ["cricbuzz-scraper", "cricketdata"] as const;

export type LiveProviderId = (typeof LIVE_FEED_PROVIDER_ORDER)[number];

/**
 * Effective live-feed priority: base order adjusted by runtime trust bias
 * (e.g. deprioritize a flaky scraper after empty/IPL-loss events).
 */
export function getEffectiveLiveProviderOrder(): string[] {
  const bias = getFederationTrustBias();
  const scraperScore = getScraperPriorityScore();
  return [...LIVE_FEED_PROVIDER_ORDER].sort((a, b) => {
    const ba = (bias[a] ?? 1) * (a === "cricbuzz-scraper" ? scraperScore : 1);
    const bb = (bias[b] ?? 1) * (b === "cricbuzz-scraper" ? scraperScore : 1);
    if (bb !== ba) return bb - ba;
    return LIVE_FEED_PROVIDER_ORDER.indexOf(a as LiveProviderId) -
      LIVE_FEED_PROVIDER_ORDER.indexOf(b as LiveProviderId);
  });
}

export function getDetailProviderOrder(): readonly string[] {
  return DETAIL_PROVIDER_ORDER;
}
