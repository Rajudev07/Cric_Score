import type { Match } from "@/lib/data/matches";
import { mergeFederatedMatchLists } from "@/lib/providers/federation/mergeFederatedMatches";
import { observeLiveFeed, recordScraperIngestFailure, recordScraperIngestSuccess } from "@/lib/providers/federation/ingestSelfHeal";
import type { FetchMode } from "@/lib/providers/cricketData/client";
import { fetchCricketDataJson } from "@/lib/providers/cricketData/client";
import {
  countRawCurrentMatchesPayload,
  transformCurrentMatchesPayload,
  transformMatchInfoPayload,
} from "@/lib/providers/cricketData/transform";
import {
  enrichMatchWithCricbuzzScraper,
  fetchCricbuzzScraperMatches,
  getCricbuzzScraperLastDiagnostics,
} from "@/lib/providers/cricbuzzScraper";
import { MemoryTTLCache } from "@/lib/cache/memoryCache";
import { dedupeRequest } from "@/lib/cache/requestDeduper";
import { staleWhileRevalidate } from "@/lib/cache/staleWhileRevalidate";
import { containsIplSignals, countIplMatches } from "@/lib/utils/iplDetection";
import {
  logRawCricketDataPayload,
  logTransformedMatchRow,
} from "@/lib/utils/ingestDebugTrace";
import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";
import { getMatchPriority, sortMatchesByPriority, getMatchPhase } from "@/lib/utils/matchPriority";
import { reportProviderFailure } from "@/lib/monitoring/logger";
import { recordProviderHealthSample } from "@/lib/ops/providerHealth";

export type AggregatedResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    console.log("[cricscore:aggregate]", ...args);
  }
}

async function loadCricketDataLive(
  mode: FetchMode
): Promise<AggregatedResult<Match[]>> {
  const t0 = Date.now();
  try {
    const res = await fetchCricketDataJson(
      "currentMatches",
      { offset: "0" },
      mode
    );
    if (!res.ok) {
      recordProviderHealthSample({
        provider: "cricketdata",
        ok: false,
        latencyMs: Date.now() - t0,
        meta: { error: res.error },
      });
      return res;
    }
    let rawN = 0;
    try {
      rawN = countRawCurrentMatchesPayload(res.data);
    } catch {
      rawN = 0;
    }
    let matches: Match[] = [];
    try {
      matches = transformCurrentMatchesPayload(res.data).map((m) => ({
        ...m,
        updatedAt: Date.now(),
      }));
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        devLog("cricketdata transform error", e instanceof Error ? e.message : String(e));
      }
      matches = [];
    }
    if (process.env.NODE_ENV === "development") {
      devLog("provider cricketdata:", {
        rawMatchCount: rawN,
        transformedCount: matches.length,
        iplCount: countIplMatches(matches),
      });
    }
    recordProviderHealthSample({
      provider: "cricketdata",
      ok: true,
      latencyMs: Date.now() - t0,
      meta: {
        transformedCount: matches.length,
        rawMatchCount: rawN,
        iplCount: countIplMatches(matches),
      },
    });
    logRawCricketDataPayload("cricketdata-live", res.data);
    for (const m of matches) logTransformedMatchRow("cricketdata-transformed", m);
    return { ok: true, data: matches };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      devLog("cricketdata live fatal", e instanceof Error ? e.message : String(e));
    }
    recordProviderHealthSample({
      provider: "cricketdata",
      ok: false,
      latencyMs: Date.now() - t0,
      meta: { fatal: true },
    });
    return { ok: false, error: "CricketData live request failed." };
  }
}

async function loadCricbuzzScraper(): Promise<Match[]> {
  const t0 = Date.now();
  try {
    const raw = await fetchCricbuzzScraperMatches();
    const matches = raw.map((m) => ({ ...m, updatedAt: Date.now() }));
    if (matches.length > 0) {
      recordScraperIngestSuccess();
    } else {
      recordScraperIngestFailure();
    }
    if (process.env.NODE_ENV === "development") {
      devLog("provider cricbuzz-scraper:", {
        transformedCount: matches.length,
        iplCount: countIplMatches(matches),
      });
    }
    recordProviderHealthSample({
      provider: "cricbuzz_scraper",
      ok: true,
      latencyMs: Date.now() - t0,
      meta: { scraperCount: matches.length, iplCount: countIplMatches(matches) },
    });
    for (const m of matches) logTransformedMatchRow("scraper-transformed", m);
    return matches;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      devLog("cricbuzz-scraper error", e instanceof Error ? e.message : String(e));
    }
    recordScraperIngestFailure();
    recordProviderHealthSample({
      provider: "cricbuzz_scraper",
      ok: false,
      latencyMs: Date.now() - t0,
      meta: { message: e instanceof Error ? e.message : String(e) },
    });
    return [];
  }
}

async function aggregateLiveMatchesCore(
  mode: FetchMode
): Promise<AggregatedResult<Match[]>> {
  try {
    const cdSettled = await loadCricketDataLive(mode);
    const scraperMatches = await loadCricbuzzScraper();

    const cdMatches = cdSettled.ok ? cdSettled.data : [];
    if (!cdSettled.ok) {
      devLog("cricketdata live failed:", cdSettled.error);
    }

    if (
      process.env.NODE_ENV === "development" &&
      scraperMatches.length === 0 &&
      cdMatches.length > 0
    ) {
      devLog("fallback: using CricketData only (scraper empty)");
    }

    const merged = mergeFederatedMatchLists([scraperMatches, cdMatches]);
    observeLiveFeed({
      scraperRows: scraperMatches.length,
      cricketDataRows: cdMatches.length,
      scraperIpl: countIplMatches(scraperMatches),
      cricketDataIpl: countIplMatches(cdMatches),
    });
    for (const m of merged) logTransformedMatchRow("post-federation-merge", m);
    const deduped = merged;
    const dedupedRemoved = scraperMatches.length + cdMatches.length - deduped.length;

    const sorted = sortMatchesByPriority(deduped);
    for (const m of sorted) logTransformedMatchRow("post-sort", m);

    const livePhaseCount = sorted.filter((m) => getMatchPhase(m) === "live").length;
    const scraperDiag = getCricbuzzScraperLastDiagnostics();
    devLog("live-phase summary", {
      livePhaseCount,
      scraperRelaxedTransformFallback: scraperDiag?.relaxedTransformFallback,
      scraperSalvageRelaxed: scraperDiag?.scraperSalvageRelaxed,
      ingestCounters: scraperDiag?.discovery?.ingestCountersSnapshot,
    });

    const live = (list: Match[]) => list.filter((m) => m.isLive).length;
    devLog("aggregation validation", {
      scraperRows: scraperMatches.length,
      scraperIpl: countIplMatches(scraperMatches),
      scraperLive: live(scraperMatches),
      cricketDataRows: cdMatches.length,
      cricketDataIpl: countIplMatches(cdMatches),
      cricketDataLive: live(cdMatches),
      mergedTotal: merged.length,
      dedupedCount: deduped.length,
      dedupedRemoved,
      iplAfterDedupe: countIplMatches(deduped),
      liveAfterDedupe: live(deduped),
    });

    if (!deduped.length && !cdSettled.ok) {
      return { ok: false, error: cdSettled.error };
    }

    return { ok: true, data: sorted };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      devLog("getAggregatedLiveMatches fatal", e instanceof Error ? e.message : String(e));
    }
    reportProviderFailure(
      e instanceof Error ? e.message : String(e),
      { stage: "aggregated_live_matches" }
    );
    return { ok: true, data: [] };
  }
}

const liveStaticCache = new MemoryTTLCache<AggregatedResult<Match[]>>();

export async function getAggregatedLiveMatches(
  mode: FetchMode = "static"
): Promise<AggregatedResult<Match[]>> {
  if (mode === "live") {
    return dedupeRequest("aggregated-live-fresh-v1", () =>
      aggregateLiveMatchesCore("live")
    );
  }
  return staleWhileRevalidate(
    liveStaticCache,
    "aggregated-live-static-v1",
    () => aggregateLiveMatchesCore("static"),
    { ttlMs: 12_000, maxStaleMs: 60_000 }
  );
}

export async function getAggregatedLiveMatchesFresh(): Promise<
  AggregatedResult<Match[]>
> {
  return getAggregatedLiveMatches("live");
}

async function aggregateMatchByIdCore(
  id: string,
  mode: FetchMode
): Promise<AggregatedResult<Match | null>> {
  const t0 = Date.now();
  try {
    const trimmed = id.trim();
    if (!trimmed) return { ok: true, data: null };

    const primary = await fetchCricketDataJson(
      "match_info",
      { id: trimmed },
      mode
    );
    if (!primary.ok) {
      recordProviderHealthSample({
        provider: "cricketdata",
        ok: false,
        latencyMs: Date.now() - t0,
        meta: { stage: "match_info", error: primary.error },
      });
      return primary;
    }

    let match: Match | null = null;
    try {
      match = transformMatchInfoPayload(primary.data);
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        devLog("transform match_info error", e instanceof Error ? e.message : String(e));
      }
      match = null;
    }
    if (!match) {
      const fallback = await fetchCricketDataJson(
        "match_info",
        { unique_id: trimmed },
        mode
      );
      if (!fallback.ok) {
        recordProviderHealthSample({
          provider: "cricketdata",
          ok: false,
          latencyMs: Date.now() - t0,
          meta: { stage: "match_info_fallback", error: fallback.error },
        });
        return fallback;
      }
      try {
        match = transformMatchInfoPayload(fallback.data);
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          devLog("transform match_info fallback error", e instanceof Error ? e.message : String(e));
        }
        match = null;
      }
    }

    if (!match) {
      recordProviderHealthSample({
        provider: "cricketdata",
        ok: true,
        latencyMs: Date.now() - t0,
        meta: { stage: "match_info", empty: true },
      });
      return { ok: true, data: null };
    }
    const base: Match = { ...match, id: trimmed, provider: "cricketdata" };
    try {
      const enriched = await enrichMatchWithCricbuzzScraper(base);
      recordProviderHealthSample({
        provider: "cricketdata",
        ok: true,
        latencyMs: Date.now() - t0,
        meta: {
          stage: "match_detail",
          commentaryLen: enriched.commentary?.length ?? 0,
          iplCount: countIplMatches([enriched]),
        },
      });
      return { ok: true, data: enriched };
    } catch {
      recordProviderHealthSample({
        provider: "cricketdata",
        ok: true,
        latencyMs: Date.now() - t0,
        meta: { stage: "match_detail", enriched: false },
      });
      return { ok: true, data: base };
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      devLog("getAggregatedMatchById fatal", e instanceof Error ? e.message : String(e));
    }
    recordProviderHealthSample({
      provider: "cricketdata",
      ok: false,
      latencyMs: Date.now() - t0,
      meta: { stage: "match_detail_fatal" },
    });
    return { ok: true, data: null };
  }
}

export async function getAggregatedMatchById(
  id: string,
  mode: FetchMode = "static"
): Promise<AggregatedResult<Match | null>> {
  const trimmed = id.trim();
  if (!trimmed) return { ok: true, data: null };
  const dedupeKey = `aggregated-match:${trimmed}:${mode}`;
  return dedupeRequest(dedupeKey, () => aggregateMatchByIdCore(trimmed, mode));
}

export function getFeaturedMatches(matches: Match[], limit = 3): Match[] {
  const liveIpl = matches.filter(
    (m) =>
      m.isLive &&
      containsIplSignals(`${m.league} ${m.team1} ${m.team2} ${m.status}`, { silent: true })
  );
  liveIpl.sort((a, b) => getMatchPriority(b) - getMatchPriority(a));
  devLog("featured IPL live:", liveIpl.length);
  return liveIpl.slice(0, limit);
}
