import { fetchCricbuzzLiveScoresHtml } from "@/lib/providers/cricbuzzScraper/client";
import {
  detectCricbuzzBlockedHtml,
  scoreHtmlRichness,
} from "@/lib/providers/cricbuzzScraper/cricbuzzHtmlQuality";
import { extractEmbeddedJsonWithTrace } from "@/lib/providers/cricbuzzScraper/parser";
import type { JsonExtractionStrategyLog } from "@/lib/providers/cricbuzzScraper/parser";
import {
  CRICBUZZ_SCRAPER_PROVIDER_ID,
  transformScrapedJsonRoots,
} from "@/lib/providers/cricbuzzScraper/transform";
import { mergeDetailEnrichmentIntoMatch } from "@/lib/providers/cricbuzz/detail/transformMatchDetail";
import type { Match } from "@/lib/data/matches";
import {
  type MatchDetailEnrichment,
  extractCricbuzzNumericMatchId,
  scrapeMatchDetail,
} from "@/lib/providers/cricbuzzScraper/detailParser";
import {
  extractCricbuzzMatchRows,
  extractCricbuzzMatchRowsTagged,
} from "@/lib/providers/cricbuzz/transform";
import { resetCricbuzzIngestCounters } from "@/lib/providers/cricbuzz/normalize/rejectDebug";
import { containsIplSignals, countIplMatches } from "@/lib/utils/iplDetection";
import { getMatchPhase } from "@/lib/utils/matchPriority";
import {
  discoverAndScrapeLiveMatches,
  type LiveDiscoveryDiagnostics,
} from "@/lib/providers/cricbuzz/discovery/discoverLiveMatchUrls";
import { matchesFromDiscoveredUrls } from "@/lib/providers/cricbuzz/discovery/parseMatchFromCricbuzzUrl";
import { consumeForceFreshCricbuzzScraper } from "@/lib/providers/federation/ingestSelfHeal";
import { reportScraperParseFailure } from "@/lib/monitoring/logger";

const RESULT_TTL_MS = 22_000;
const SCRAPER_TOTAL_TIMEOUT_MS = 4_000;

let resultCache: { matches: Match[]; fetchedAt: number } | null = null;

export type CricbuzzScraperRunDiagnostics = {
  atIso: string;
  fetchOk: boolean;
  fetchStatus?: number;
  finalUrl?: string;
  htmlRichnessScore?: number;
  htmlEffectiveScore?: number;
  htmlBlocked?: ReturnType<typeof detectCricbuzzBlockedHtml>;
  parallelFetchScores?: { url: string; richness: number; len: number; ok: boolean }[];
  htmlReceived: boolean;
  htmlLength: number;
  htmlMarkers: Record<string, boolean>;
  htmlSnippet: string;
  extractionTrace: JsonExtractionStrategyLog[];
  rootsFound: number;
  extractionStrategiesWithRoots?: string[];
  candidateMatchObjectsPreTransform?: number;
  iplCandidateRowsPreTransform?: number;
  rowsParsedPreTransform: number;
  extractionSucceeded: boolean;
  rowsAfterTransform: number;
  rowsAfterIplSafety: number;
  iplDetectedCount: number;
  parseFailures: { where: string; detail: string }[];
  discovery?: LiveDiscoveryDiagnostics | null;
  relaxedTransformFallback?: boolean;
  scraperSalvageRelaxed?: boolean;
};

let lastRunDiagnostics: CricbuzzScraperRunDiagnostics | null = null;

export function getCricbuzzScraperLastDiagnostics(): CricbuzzScraperRunDiagnostics | null {
  return lastRunDiagnostics;
}

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[cricscore:cricbuzz-scraper]", ...args);
  }
}

function htmlMarkers(html: string): Record<string, boolean> {
  const h = html;
  return {
    nextDataScript: /<script[^>]*\bid=["']__NEXT_DATA__["']/i.test(h),
    nextDataAssign: /__NEXT_DATA__\s*=/.test(h),
    initialState: /__INITIAL_STATE__|window\.__INITIAL_STATE__|__PRELOADED_STATE__/i.test(
      h
    ),
    ldJson: /type=["']application\/ld\+json["']/i.test(h),
    liveMatchBlob: /"matchInfo"|seriesMatches|liveMatches|matchList/i.test(h),
    indianPremierLeague: /Indian Premier League/i.test(h),
    delhiCapitals: /Delhi Capitals/i.test(h),
    rajasthanRoyals: /Rajasthan Royals/i.test(h),
  };
}

function logHtmlDebug(url: string, status: number, html: string): void {
  const markers = htmlMarkers(html);
  const snippet = html.slice(0, 1000).replace(/\s+/g, " ");
  devLog("html-debug", {
    url,
    status,
    htmlLength: html.length,
    markers,
    snippet,
  });
  if (process.env.NODE_ENV === "development") {
    console.log("[cricscore:cricbuzz-scraper:html]", {
      url,
      status,
      htmlLength: html.length,
      markers,
      snippet,
    });
  }
}

function mergeUrlParsedMatches(htmlMatches: Match[], urlMatches: Match[]): Match[] {
  const byId = new Map<string, Match>();
  for (const m of urlMatches) byId.set(m.id, m);
  for (const m of htmlMatches) {
    const existing = byId.get(m.id);
    if (!existing || (m.score1 && m.score1 !== "—")) byId.set(m.id, m);
  }
  return [...byId.values()];
}

function urlMatchesFromDiscovery(diag: LiveDiscoveryDiagnostics | null | undefined): Match[] {
  const urls = diag?.allDiscoveredUrls?.length
    ? diag.allDiscoveredUrls
    : diag?.sampleDiscoveredUrls ?? [];
  return matchesFromDiscoveredUrls(urls);
}

function sortScraperPriority(matches: Match[]): Match[] {
  const ipl = matches.filter((m) =>
    containsIplSignals(`${m.league} ${m.team1} ${m.team2} ${m.status}`, { silent: true })
  );
  const rest = matches.filter(
    (m) => !containsIplSignals(`${m.league} ${m.team1} ${m.team2} ${m.status}`, { silent: true })
  );
  return [...ipl, ...rest];
}

const IPL_FRANCHISE_RE =
  /delhi capitals|rajasthan royals|mumbai indians|chennai super kings|kolkata knight riders|royal challengers|sunrisers hyderabad|punjab kings|gujarat titans|lucknow super giants/i;

/** Force live-ish flags when IPL context is clear but provider fields are weak. */
function applyScraperIplLiveSafety(matches: Match[]): Match[] {
  return matches.map((m) => {
    const blob = `${m.league} ${m.team1} ${m.team2} ${m.matchType}`.toLowerCase();
    const leagueIplish =
      /\b(indian|t20|league|premier)\b/i.test(m.league) ||
      containsIplSignals(`${m.league} ${m.team1} ${m.team2} ${m.status}`, { silent: true });
    const franchisePair =
      IPL_FRANCHISE_RE.test(`${m.team1} ${m.team2}`) ||
      (/\bdc\b/i.test(m.team1 + m.team2) && /\brr\b/i.test(m.team1 + m.team2));
    if (!leagueIplish && !franchisePair) return m;

    const hasPlaySignal =
      (m.score1 && m.score1 !== "—") ||
      (m.score2 && m.score2 !== "—") ||
      (m.overs && m.overs !== "—") ||
      /\b(need|opt to|versus|innings|live|drinks|stumps|strategic)\b/i.test(m.status);

    if (!hasPlaySignal) return m;

    if (m.matchEnded) return m;
    return {
      ...m,
      matchStarted: true,
      isLive: true,
    };
  });
}

function logIplRows(stage: string, matches: Match[]): void {
  for (const m of matches) {
    const hay = `${m.league} ${m.team1} ${m.team2} ${m.status}`;
    const ipl = containsIplSignals(hay, { silent: true });
    if (!ipl) continue;
    devLog("ipl-row", stage, {
      id: m.id,
      league: m.league,
      team1: m.team1,
      team2: m.team2,
      isLive: m.isLive,
      matchStarted: m.matchStarted,
      matchEnded: m.matchEnded,
      status: m.status.slice(0, 120),
    });
  }
}

/**
 * Server-only: fetch Cricbuzz HTML, extract embedded JSON, normalize to Match[].
 * Does not cache empty results (immediate retry on failure).
 */
export async function fetchCricbuzzScraperMatches(): Promise<Match[]> {
  const now = Date.now();
  if (consumeForceFreshCricbuzzScraper()) {
    resultCache = null;
  }
  if (resultCache && now - resultCache.fetchedAt < RESULT_TTL_MS) {
    if (process.env.NODE_ENV === "development") {
      devLog("result cache hit", "count", resultCache.matches.length);
    }
    return resultCache.matches;
  }

  const parseFailures: { where: string; detail: string }[] = [];
  const diag: CricbuzzScraperRunDiagnostics = {
    atIso: new Date().toISOString(),
    fetchOk: false,
    htmlReceived: false,
    htmlLength: 0,
    htmlMarkers: {},
    htmlSnippet: "",
    extractionTrace: [],
    rootsFound: 0,
    rowsParsedPreTransform: 0,
    extractionSucceeded: false,
    rowsAfterTransform: 0,
    rowsAfterIplSafety: 0,
    iplDetectedCount: 0,
    parseFailures: [],
  };

  resetCricbuzzIngestCounters();

  const matches = await Promise.race([
    runCricbuzzScraperIngest(parseFailures, diag, now),
    new Promise<Match[]>((resolve) => setTimeout(() => resolve([]), SCRAPER_TOTAL_TIMEOUT_MS)),
  ]);

  if (!matches.length && diag.parseFailures.length === 0) {
    parseFailures.push({ where: "timeout", detail: `>${SCRAPER_TOTAL_TIMEOUT_MS}ms` });
    lastRunDiagnostics = { ...diag, parseFailures };
  }

  return matches;
}

async function runCricbuzzScraperIngest(
  parseFailures: { where: string; detail: string }[],
  diag: CricbuzzScraperRunDiagnostics,
  now: number
): Promise<Match[]> {
  try {
    const disc = await discoverAndScrapeLiveMatches({
      seedTimeoutMs: 2_000,
      perMatchTimeoutMs: 2_000,
      concurrency: 3,
      maxTargets: 5,
      maxSeedPages: 5,
    });
    diag.discovery = disc.diagnostics;

    let roots: unknown[] = [...disc.roots];
    const listTraces: JsonExtractionStrategyLog[] = [];

    const got = await fetchCricbuzzLiveScoresHtml();
    if (got) {
      diag.fetchStatus = got.status;
      diag.finalUrl = got.url;
      diag.htmlRichnessScore = scoreHtmlRichness(got.html);
      diag.htmlEffectiveScore = got.richness;
      diag.htmlBlocked = detectCricbuzzBlockedHtml(got.html);
      diag.parallelFetchScores = got.parallelScores;
      diag.htmlReceived = true;
      diag.htmlLength = got.html.length;
      diag.htmlMarkers = htmlMarkers(got.html);
      diag.htmlSnippet = got.html.slice(0, 1000).replace(/\s+/g, " ");
      logHtmlDebug(got.url, got.status, got.html);
      const { roots: listRoots, trace } = extractEmbeddedJsonWithTrace(got.html);
      roots = [...roots, ...listRoots];
      listTraces.push(...trace);
    }

    diag.fetchOk = roots.length > 0;
    const urlParsed = urlMatchesFromDiscovery(disc.diagnostics);

    if (!diag.fetchOk && urlParsed.length === 0) {
      lastRunDiagnostics = { ...diag, parseFailures: [{ where: "fetch", detail: "no_discovery_no_list_html" }] };
      devLog("no HTML from discovery or list scrape", diag);
      reportScraperParseFailure("cricbuzz scraper: no HTML from discovery or list scrape", {
        diagnostics: diag,
      });
      return [];
    }

    if (!diag.fetchOk && urlParsed.length > 0) {
      devLog("URL-parsed fallback (no JSON roots)", urlParsed.length);
      const sorted = sortScraperPriority(applyScraperIplLiveSafety(urlParsed));
      resultCache = { matches: sorted, fetchedAt: now };
      lastRunDiagnostics = diag;
      return sorted;
    }

    diag.extractionTrace = [
      {
        name: "discovery_per_match",
        attempted: true,
        parseOk: disc.roots.length > 0,
        rootsAdded: disc.roots.length,
      },
      ...listTraces,
    ];
    diag.rootsFound = roots.length;
    diag.extractionSucceeded = roots.length > 0;

    for (const t of listTraces) {
      if (t.attempted && !t.parseOk && t.parseError) {
        parseFailures.push({ where: t.name, detail: t.parseError });
      }
    }
    diag.parseFailures = parseFailures;

    const strategiesWithRoots = diag.extractionTrace
      .filter((t) => t.attempted && t.rootsAdded > 0)
      .map((t) => t.name);
    diag.extractionStrategiesWithRoots = strategiesWithRoots;

    let rowsParsedPreTransform = 0;
    let candidateTagged = 0;
    let iplCandidates = 0;
    for (const r of roots) {
      try {
        rowsParsedPreTransform += extractCricbuzzMatchRows(r).length;
        const tagged = extractCricbuzzMatchRowsTagged(r);
        candidateTagged += tagged.length;
        for (const { row } of tagged) {
          const blob = JSON.stringify(row).toLowerCase();
          if (
            /\bipl\b|indian premier league|indian t20 league|tata ipl|delhi capitals|rajasthan royals/.test(
              blob
            )
          ) {
            iplCandidates++;
          }
        }
      } catch (e) {
        parseFailures.push({
          where: "extractCricbuzzMatchRows",
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }
    diag.rowsParsedPreTransform = rowsParsedPreTransform;
    diag.candidateMatchObjectsPreTransform = candidateTagged;
    diag.iplCandidateRowsPreTransform = iplCandidates;

    devLog("[cricscore:cricbuzz-scraper:extract-validation]", {
      strategiesWithRoots,
      rootCount: roots.length,
      candidateMatchObjects: candidateTagged,
      iplCandidateCount: iplCandidates,
    });

    let matches: Match[] = [];
    try {
      matches = transformScrapedJsonRoots(roots);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      parseFailures.push({ where: "transformScrapedJsonRoots", detail: msg });
      devLog("transform failure", msg);
      matches = [];
    }
    diag.rowsAfterTransform = matches.length;
    logIplRows("pre-ipl-safety", matches);

    matches = applyScraperIplLiveSafety(matches);
    logIplRows("post-ipl-safety", matches);

    matches = sortScraperPriority(matches);

    const countLive = (list: Match[]) => list.filter((m) => getMatchPhase(m) === "live").length;

    if (countLive(matches) === 0 && roots.length > 0) {
      try {
        matches = transformScrapedJsonRoots(roots, { relaxedTeams: true, relaxedStale: true });
        matches = applyScraperIplLiveSafety(matches);
        matches = sortScraperPriority(matches);
        diag.relaxedTransformFallback = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        parseFailures.push({ where: "transform_relaxed_same_roots", detail: msg });
        devLog("relaxed same-roots transform failed", msg);
      }
    }

    if (countLive(matches) === 0) {
      try {
        const disc2 = await discoverAndScrapeLiveMatches({
          seedTimeoutMs: 2_000,
          perMatchTimeoutMs: 2_000,
          concurrency: 3,
          maxTargets: 5,
          maxSeedPages: 5,
          relaxedValidation: true,
        });
        const mergedRoots = [...roots, ...disc2.roots];
        matches = transformScrapedJsonRoots(mergedRoots, {
          relaxedTeams: true,
          relaxedStale: true,
        });
        matches = applyScraperIplLiveSafety(matches);
        matches = sortScraperPriority(matches);
        diag.scraperSalvageRelaxed = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        parseFailures.push({ where: "discovery_relaxed_salvage", detail: msg });
        devLog("relaxed discovery salvage failed", msg);
      }
    }

    diag.rowsAfterTransform = matches.length;
    diag.rowsAfterIplSafety = matches.length;
    diag.iplDetectedCount = countIplMatches(matches);
    logIplRows("post-salvage", matches);

    const urlMerged = urlMatchesFromDiscovery(diag.discovery);
    if (urlMerged.length) {
      matches = mergeUrlParsedMatches(matches, urlMerged);
      matches = sortScraperPriority(applyScraperIplLiveSafety(matches));
      devLog("merged URL-parsed matches", urlMerged.length, "total", matches.length);
    }

    lastRunDiagnostics = diag;

    devLog("[cricscore:cricbuzz-scraper:ingest-counters]", {
      ...diag.discovery?.ingestCountersSnapshot,
      relaxedTransformFallback: diag.relaxedTransformFallback,
      scraperSalvageRelaxed: diag.scraperSalvageRelaxed,
      livePhaseCount: countLive(matches),
    });

    if (matches.length === 0) {
      const urlOnly = urlMatchesFromDiscovery(diag.discovery);
      if (urlOnly.length) {
        matches = sortScraperPriority(applyScraperIplLiveSafety(urlOnly));
        devLog("URL-only fallback matches", matches.length);
      }
    }

    if (matches.length === 0) {
      console.error("[cricscore:cricbuzz-scraper] ZERO_MATCHES", diag);
      reportScraperParseFailure("cricbuzz scraper produced 0 matches after extraction", {
        diagnostics: diag,
      });
      resultCache = null;
      return [];
    }

    resultCache = { matches, fetchedAt: now };
    devLog("ingest", got?.url ?? "discovery-per-match", "parsedMatchCount", matches.length, {
      iplDetected: diag.iplDetectedCount,
      provider: CRICBUZZ_SCRAPER_PROVIDER_ID,
    });
    return matches;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    parseFailures.push({ where: "fatal", detail: msg });
    lastRunDiagnostics = { ...diag, parseFailures };
    console.error("[cricscore:cricbuzz-scraper] fatal", msg, diag);
    reportScraperParseFailure(`cricbuzz scraper fatal: ${msg}`, { diagnostics: lastRunDiagnostics });
    resultCache = null;
    return [];
  }
}

export { CRICBUZZ_SCRAPER_PROVIDER_ID };

const ENRICH_CACHE_TTL_MS = 18_000;
const enrichCache = new Map<
  string,
  { enrichment: MatchDetailEnrichment | null; fetchedAt: number }
>();

/**
 * Merge server-scraped scorecard + commentary into an existing Match (CricketData base).
 */
export async function enrichMatchWithCricbuzzScraper(match: Match): Promise<Match> {
  const mid = extractCricbuzzNumericMatchId(match.id);
  if (!mid) return match;

  const now = Date.now();
  const hit = enrichCache.get(mid);
  if (hit && now - hit.fetchedAt < ENRICH_CACHE_TTL_MS) {
    if (process.env.NODE_ENV === "development") {
      devLog("enrich payload cache hit", mid);
    }
    const d = hit.enrichment;
    if (!d) return match;
    return mergeDetailEnrichmentIntoMatch(match, d);
  }

  try {
    const d = await scrapeMatchDetail(mid, { team1: match.team1, team2: match.team2 });
    enrichCache.set(mid, { enrichment: d, fetchedAt: now });
    if (!d) return match;
    return mergeDetailEnrichmentIntoMatch(match, d);
  } catch {
    enrichCache.set(mid, { enrichment: null, fetchedAt: now });
    return match;
  }
}
