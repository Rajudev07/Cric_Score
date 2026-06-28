import { extractEmbeddedJsonWithTrace } from "@/lib/providers/cricbuzzScraper/parser";
import { cricbuzzBrowserHeaders } from "@/lib/providers/cricbuzz/sharedRequestHeaders";
import { scoreHtmlRichness } from "@/lib/providers/cricbuzzScraper/cricbuzzHtmlQuality";
import { extractLiveMatchLinks } from "@/lib/providers/cricbuzz/discovery/extractLiveMatchLinks";
import {
  extractNumericMatchIdFromUrl,
  prioritizedFetchUrls,
} from "@/lib/providers/cricbuzz/discovery/normalizeMatchLink";
import { isRejectableCricbuzzUrl } from "@/lib/providers/cricbuzz/discovery/validateMatchLink";
import { validateCricbuzzDiscoveryPage } from "@/lib/providers/cricbuzz/normalize/rejectStaleMatches";
import {
  bumpCricbuzzPagesFetched,
  getCricbuzzIngestCountersSnapshot,
} from "@/lib/providers/cricbuzz/normalize/rejectDebug";
import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";

const DISCOVER_TAG = "[cricscore:discover]";

function discoverLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    console.log(DISCOVER_TAG, ...args);
  }
}

const DEFAULT_SEED_URLS = [
  "https://www.cricbuzz.com/",
  "https://www.cricbuzz.com/cricket-match/live-scores",
  "https://www.cricbuzz.com/cricket-match/live-scores/international",
  "https://www.cricbuzz.com/live-cricket-scores/",
  "https://www.cricbuzz.com/cricket-schedule/series/international",
  "https://www.cricbuzz.com/cricket-schedule/upcoming-series/international",
  "https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches",
  "https://www.cricbuzz.com/cricket-series",
  "https://www.cricbuzz.com/cricket-series/live",
];

function seedUrlsToFetch(): string[] {
  const extra = process.env.CRICBUZZ_DISCOVERY_SEEDS?.trim();
  const parts = extra ? extra.split(/[,;\s]+/).filter(Boolean) : [];
  return [...new Set([...parts, ...DEFAULT_SEED_URLS])];
}

export type DiscoveredMatchTarget = {
  matchId: string;
  livePriority: boolean;
  seedSources: string[];
};

export type LiveDiscoveryDiagnostics = {
  seedsTried: number;
  seedsOk: number;
  rawLinks: number;
  validMatchIds: number;
  liveHints: number;
  rejectedUrls: number;
  duplicateUrls: number;
  uniqueTargets: number;
  scrapeAttempts: number;
  scrapeSuccess: number;
  scrapeFailures: number;
  scrapeSuccessPct: number | null;
  discoverySources: string[];
  sampleDiscoveredUrls: string[];
  allDiscoveredUrls: string[];
  relaxedValidation?: boolean;
  ingestCountersSnapshot?: {
    pagesFetched: number;
    pagesValidated: number;
    pagesRejected: number;
    matchesEmitted: number;
  };
};

async function fetchHtmlWithTimeout(
  url: string,
  timeoutMs: number
): Promise<{ html: string; status: number } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: cricbuzzBrowserHeaders(),
      signal: ctrl.signal,
      next: { revalidate: 30 },
    });
    const html = await res.text();
    if (!res.ok) return null;
    return { html, status: res.status };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch seed listing pages and extract live match URL references + embedded match ids.
 */
export async function discoverLiveMatchUrls(options?: {
  seedTimeoutMs?: number;
  maxTargets?: number;
  maxSeedPages?: number;
}): Promise<{ targets: DiscoveredMatchTarget[]; diagnostics: LiveDiscoveryDiagnostics }> {
  const seedTimeoutMs = options?.seedTimeoutMs ?? 2_000;
  const maxTargets = options?.maxTargets ?? 5;
  const maxSeedPages = options?.maxSeedPages ?? 5;
  const seeds = seedUrlsToFetch().slice(0, maxSeedPages);

  const settled = await Promise.all(
    seeds.map(async (url) => {
      const got = await fetchHtmlWithTimeout(url, seedTimeoutMs);
      return { url, got };
    })
  );

  let seedsOk = 0;
  const allRefs: ReturnType<typeof extractLiveMatchLinks> = [];
  const discoverySources: string[] = [];

  for (const { url, got } of settled) {
    if (!got || got.html.length < 400) continue;
    seedsOk++;
    discoverySources.push(url);
    allRefs.push(...extractLiveMatchLinks(got.html, url));
  }

  const globalUrl = new Set<string>();
  let duplicateUrls = 0;
  let rejectedUrls = 0;
  const byId = new Map<string, DiscoveredMatchTarget>();

  for (const ref of allRefs) {
    const canon = ref.url.split("?")[0];
    if (globalUrl.has(canon)) {
      duplicateUrls++;
      continue;
    }
    globalUrl.add(canon);
    if (isRejectableCricbuzzUrl(ref.url)) {
      rejectedUrls++;
      continue;
    }
    const id = ref.matchId || extractNumericMatchIdFromUrl(ref.url);
    if (!id) {
      rejectedUrls++;
      continue;
    }
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, {
        matchId: id,
        livePriority: ref.liveHint,
        seedSources: [ref.source],
      });
    } else {
      prev.livePriority = prev.livePriority || ref.liveHint;
      if (!prev.seedSources.includes(ref.source)) prev.seedSources.push(ref.source);
    }
  }

  let targets = [...byId.values()];
  targets.sort((a, b) => {
    if (a.livePriority !== b.livePriority) return a.livePriority ? -1 : 1;
    return parseInt(b.matchId, 10) - parseInt(a.matchId, 10);
  });
  targets = targets.slice(0, maxTargets);

  const liveHints = targets.filter((t) => t.livePriority).length;
  const sampleDiscoveredUrls = [...globalUrl].slice(0, 20);
  const allDiscoveredUrls = [...globalUrl];

  const diagnostics: LiveDiscoveryDiagnostics = {
    seedsTried: seeds.length,
    seedsOk,
    rawLinks: allRefs.length,
    validMatchIds: byId.size,
    liveHints,
    rejectedUrls,
    duplicateUrls,
    uniqueTargets: targets.length,
    scrapeAttempts: 0,
    scrapeSuccess: 0,
    scrapeFailures: 0,
    scrapeSuccessPct: null,
    discoverySources,
    sampleDiscoveredUrls,
    allDiscoveredUrls,
  };

  discoverLog({
    discoveredUrls: globalUrl.size,
    iplUrlsFound: allRefs.filter((r) => r.liveHint).length,
    validLiveTargets: targets.length,
    rejectedUrls,
    duplicateUrls,
    discoverySources,
    sample: sampleDiscoveredUrls.slice(0, 8),
  });

  return { targets, diagnostics };
}

async function fetchRootsForMatchId(
  matchId: string,
  timeoutMs: number,
  relaxedValidation?: boolean
): Promise<unknown[]> {
  const urls = prioritizedFetchUrls(matchId);
  const fetched: { html: string; score: number; url: string }[] = [];
  for (const url of urls.slice(0, 4)) {
    const got = await fetchHtmlWithTimeout(url, timeoutMs);
    if (!got || got.html.length < 500) continue;
    bumpCricbuzzPagesFetched();
    const score = scoreHtmlRichness(got.html);
    fetched.push({ html: got.html, score, url });
    if (fetched.length >= 2 && score >= 28 && got.html.includes("matchInfo")) {
      break;
    }
  }
  if (!fetched.length) return [];

  fetched.sort((a, b) => b.score - a.score || b.html.length - a.html.length);
  const mergedRoots: unknown[] = [];
  const seenSer = new Set<string>();

  for (const page of fetched.slice(0, 2)) {
    const val = validateCricbuzzDiscoveryPage(page.html, page.url, matchId, {
      relaxed: relaxedValidation,
    });
    if (!val.ok) {
      discoverLog("discovery target rejected", { matchId, url: page.url, reason: val.reason });
      continue;
    }
    const { roots } = extractEmbeddedJsonWithTrace(page.html);
    for (const root of roots) {
      try {
        const ser = JSON.stringify(root);
        if (ser.length < 40 || seenSer.has(ser)) continue;
        seenSer.add(ser);
        mergedRoots.push(root);
      } catch {
        mergedRoots.push(root);
      }
    }
  }
  return mergedRoots;
}

/**
 * Concurrent per-match HTML fetch + JSON root extraction (partial failures tolerated).
 */
export async function scrapeDiscoveredMatchPages(
  targets: DiscoveredMatchTarget[],
  options?: { concurrency?: number; timeoutMs?: number; relaxedValidation?: boolean }
): Promise<{ roots: unknown[]; diagnostics: Pick<LiveDiscoveryDiagnostics, "scrapeAttempts" | "scrapeSuccess" | "scrapeFailures" | "scrapeSuccessPct" | "relaxedValidation" | "ingestCountersSnapshot"> }> {
  const concurrency = Math.max(1, Math.min(8, options?.concurrency ?? 4));
  const timeoutMs = options?.timeoutMs ?? 2_000;
  const relaxedValidation = options?.relaxedValidation ?? false;
  const buckets: DiscoveredMatchTarget[][] = Array.from({ length: concurrency }, () => []);
  targets.forEach((t, i) => {
    buckets[i % concurrency]!.push(t);
  });

  let scrapeSuccess = 0;
  let scrapeFailures = 0;

  const parts = await Promise.all(
    buckets.map(async (bucket) => {
      const acc: unknown[] = [];
      for (const t of bucket) {
        try {
          const r = await fetchRootsForMatchId(t.matchId, timeoutMs, relaxedValidation);
          if (r.length) {
            acc.push(...r);
            scrapeSuccess++;
          } else {
            scrapeFailures++;
          }
        } catch {
          scrapeFailures++;
        }
      }
      return acc;
    })
  );
  const roots = parts.flat();

  const scrapeAttempts = scrapeSuccess + scrapeFailures;
  const scrapeSuccessPct =
    scrapeAttempts > 0 ? Math.round((scrapeSuccess / scrapeAttempts) * 1000) / 10 : null;

  discoverLog({
    scrapeSuccess,
    scrapeFailures,
    scrapeSuccessPct,
    rootsExtracted: roots.length,
  });

  return {
    roots,
    diagnostics: {
      scrapeAttempts,
      scrapeSuccess,
      scrapeFailures,
      scrapeSuccessPct,
      relaxedValidation,
      ingestCountersSnapshot: getCricbuzzIngestCountersSnapshot(),
    },
  };
}

/** Discover targets then scrape them (primary live ingestion path). */
export async function discoverAndScrapeLiveMatches(options?: {
  seedTimeoutMs?: number;
  perMatchTimeoutMs?: number;
  concurrency?: number;
  maxTargets?: number;
  maxSeedPages?: number;
  relaxedValidation?: boolean;
}): Promise<{ roots: unknown[]; diagnostics: LiveDiscoveryDiagnostics }> {
  const { targets, diagnostics: d0 } = await discoverLiveMatchUrls({
    seedTimeoutMs: options?.seedTimeoutMs,
    maxTargets: options?.maxTargets,
    maxSeedPages: options?.maxSeedPages,
  });
  if (!targets.length) {
    return {
      roots: [],
      diagnostics: { ...d0, scrapeSuccessPct: null },
    };
  }
  const { roots, diagnostics: scrapeDiag } = await scrapeDiscoveredMatchPages(targets, {
    concurrency: options?.concurrency,
    timeoutMs: options?.perMatchTimeoutMs,
    relaxedValidation: options?.relaxedValidation,
  });
  const diagnostics: LiveDiscoveryDiagnostics = {
    ...d0,
    ...scrapeDiag,
  };
  return { roots, diagnostics };
}
