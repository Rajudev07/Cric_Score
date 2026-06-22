/**
 * Runtime trust bias + “self-heal” signals when a feed suddenly drops IPL / goes empty.
 * Process-local only (resets on deploy / cold start).
 */

const trustBias: Record<string, number> = {
  "cricbuzz-scraper": 1,
  cricketdata: 1,
  cricbuzz: 1,
};

let forceFreshScraperNext = false;

const MIN_BIAS = 0.55;
const MAX_BIAS = 1.35;

const PRIORITY_FLOOR = 0.1;
const PRIORITY_CEILING = 1.0;
const PRIORITY_PENALTY = 0.2;
const PRIORITY_RECOVERY = 0.05;
const CONSECUTIVE_ERROR_THRESHOLD = 3;

let scraperPriorityScore = 1.0;
let consecutiveScraperErrors = 0;

export function getScraperPriorityScore(): number {
  return scraperPriorityScore;
}

export function getProviderPriorityScores(): Record<string, number> {
  return {
    cricketdata: 1,
    "cricbuzz-scraper": scraperPriorityScore,
    cricbuzz_scraper: scraperPriorityScore,
  };
}

/** Record a successful Cricbuzz scraper ingest — nudge priority back toward 1.0. */
export function recordScraperIngestSuccess(): void {
  consecutiveScraperErrors = 0;
  scraperPriorityScore = Math.min(PRIORITY_CEILING, scraperPriorityScore + PRIORITY_RECOVERY);
  adjustBias("cricbuzz-scraper", 0.02);
}

/** Record a failed Cricbuzz scraper ingest — degrade after 3 consecutive failures. */
export function recordScraperIngestFailure(): void {
  consecutiveScraperErrors += 1;
  if (consecutiveScraperErrors >= CONSECUTIVE_ERROR_THRESHOLD) {
    scraperPriorityScore = Math.max(PRIORITY_FLOOR, scraperPriorityScore - PRIORITY_PENALTY);
    adjustBias("cricbuzz-scraper", -0.06);
    consecutiveScraperErrors = 0;
  }
}

export function getFederationTrustBias(): Record<string, number> {
  const c = trustBias["cricbuzz-scraper"] ?? 1;
  return { ...trustBias, cricbuzz_scraper: c };
}

function adjustBias(provider: string, delta: number): void {
  const cur = trustBias[provider] ?? 1;
  trustBias[provider] = Math.min(MAX_BIAS, Math.max(MIN_BIAS, cur + delta));
}

export function requestFreshCricbuzzScraperNext(): void {
  forceFreshScraperNext = true;
}

export function consumeForceFreshCricbuzzScraper(): boolean {
  const v = forceFreshScraperNext;
  forceFreshScraperNext = false;
  return v;
}

export type LiveFeedObservation = {
  scraperRows: number;
  cricketDataRows: number;
  scraperIpl: number;
  cricketDataIpl: number;
};

/**
 * If scraper suddenly drops all rows or all IPL while CricketData still shows IPL,
 * nudge trust down and force a fresh scrape on the next cycle (bypass short-lived result cache).
 */
export function observeLiveFeed(obs: LiveFeedObservation): void {
  const { scraperRows, cricketDataRows, scraperIpl, cricketDataIpl } = obs;

  if (scraperRows === 0 && cricketDataRows > 0) {
    adjustBias("cricbuzz-scraper", -0.08);
    requestFreshCricbuzzScraperNext();
  }

  if (cricketDataIpl > 0 && scraperIpl === 0 && scraperRows > 0) {
    adjustBias("cricbuzz-scraper", -0.05);
    requestFreshCricbuzzScraperNext();
  }

  if (scraperIpl > 0 || scraperRows > 0) {
    adjustBias("cricbuzz-scraper", 0.01);
  }
  if (cricketDataRows > 0) {
    adjustBias("cricketdata", 0.005);
  }
}
