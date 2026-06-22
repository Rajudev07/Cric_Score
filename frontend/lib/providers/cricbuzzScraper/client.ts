import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  detectCricbuzzBlockedHtml,
  effectiveHtmlScore,
  hasMatchInfoString,
  hasNextDataScript,
  scoreHtmlRichness,
} from "@/lib/providers/cricbuzzScraper/cricbuzzHtmlQuality";
import { cricbuzzBrowserHeaders } from "@/lib/providers/cricbuzz/sharedRequestHeaders";

export { cricbuzzBrowserHeaders };

/** Primary live list sources (parallel); richest hydration wins. */
const PARALLEL_LIVE_URLS = [
  "https://www.cricbuzz.com/cricket-match/live-scores",
  "https://www.cricbuzz.com/live-cricket-scores/",
  "https://www.cricbuzz.com/cricket-series/9237/indian-premier-league-2026/matches",
  "https://www.cricbuzz.com/",
];

const TTL_MS = 22_000;

type CacheEntry = { html: string; fetchedAt: number; url: string; status: number };

let htmlCache: CacheEntry | null = null;

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[cricscore:cricbuzz-scraper:client]", ...args);
  }
}

function urlsToTry(): string[] {
  const extra = process.env.CRICBUZZ_SCRAPE_URLS?.trim();
  const base = extra
    ? [...extra.split(/[,;\s]+/).filter(Boolean), ...PARALLEL_LIVE_URLS]
    : [...PARALLEL_LIVE_URLS];
  return [...new Set(base)];
}

function logPostFetchHtml(url: string, status: number, html: string): void {
  const blocked = detectCricbuzzBlockedHtml(html);
  devLog("fetch-html-diagnostics", {
    url,
    status,
    htmlLength: html.length,
    first500: html.slice(0, 500).replace(/\s+/g, " "),
    nextDataPresent: hasNextDataScript(html),
    matchInfoPresent: hasMatchInfoString(html),
    ...blocked,
    richness: scoreHtmlRichness(html),
  });
}

async function saveCricbuzzDebugHtmlSnapshot(url: string, html: string): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;
  try {
    const dir = path.join(process.cwd(), ".tmp", "cricbuzz-debug");
    await mkdir(dir, { recursive: true });
    const safe = url.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const fn = `${ts}_${safe || "page"}.html`;
    const full = path.join(dir, fn);
    const max = 450_000;
    await writeFile(full, html.length > max ? `${html.slice(0, max)}\n<!-- truncated -->\n` : html, "utf8");
    devLog("saved debug snapshot", full);
  } catch (e) {
    devLog("debug snapshot write failed", e instanceof Error ? e.message : String(e));
  }
}

async function fetchHtmlOnce(url: string): Promise<{ html: string; status: number } | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: cricbuzzBrowserHeaders(),
      next: { revalidate: 0 },
    });
    const html = await res.text();
    if (!res.ok) {
      devLog("fetch not ok", url, res.status, "htmlLen", html.length);
      return null;
    }
    return { html, status: res.status };
  } catch (e) {
    devLog("fetch error", url, e instanceof Error ? e.message : String(e));
    return null;
  }
}

function pickBestHtml(
  pairs: { url: string; html: string; status: number }[]
): { html: string; url: string; status: number; richness: number } | null {
  if (!pairs.length) return null;
  let best: { html: string; url: string; status: number; richness: number } | null = null;
  for (const p of pairs) {
    const richness = effectiveHtmlScore(p.html);
    if (!best || richness > best.richness || (richness === best.richness && p.html.length > best.html.length)) {
      best = { ...p, richness };
    }
  }
  return best;
}

/**
 * Server-only HTML fetch with in-memory TTL cache (single best response).
 * Fetches all configured URLs in parallel and keeps the richest hydration payload.
 */
export async function fetchCricbuzzLiveScoresHtml(): Promise<{
  html: string;
  url: string;
  status: number;
  richness: number;
  parallelScores: { url: string; richness: number; len: number; ok: boolean }[];
} | null> {
  const now = Date.now();
  if (htmlCache && now - htmlCache.fetchedAt < TTL_MS) {
    if (process.env.NODE_ENV === "development") {
      devLog("cache hit", htmlCache.url, "ageMs", now - htmlCache.fetchedAt);
    }
    return {
      html: htmlCache.html,
      url: htmlCache.url,
      status: htmlCache.status,
      richness: scoreHtmlRichness(htmlCache.html),
      parallelScores: [{ url: htmlCache.url, richness: scoreHtmlRichness(htmlCache.html), len: htmlCache.html.length, ok: true }],
    };
  }

  const urls = urlsToTry();
  const settled = await Promise.all(
    urls.map(async (url) => {
      const got = await fetchHtmlOnce(url);
      return { url, got };
    })
  );

  const parallelScores: { url: string; richness: number; len: number; ok: boolean }[] = [];
  const okPairs: { url: string; html: string; status: number }[] = [];

  for (const { url, got } of settled) {
    if (!got) {
      parallelScores.push({ url, richness: -1, len: 0, ok: false });
      continue;
    }
    logPostFetchHtml(url, got.status, got.html);
    const r = scoreHtmlRichness(got.html);
    parallelScores.push({ url, richness: r, len: got.html.length, ok: true });
    if (got.html.length >= 200) {
      okPairs.push({ url, html: got.html, status: got.status });
    }
  }

  if (!okPairs.length) {
    for (const { url, got } of settled) {
      if (got && got.html.length >= 80) {
        okPairs.push({ url, html: got.html, status: got.status });
      }
    }
  }

  const best = pickBestHtml(okPairs);
  if (!best) {
    htmlCache = null;
    return null;
  }

  htmlCache = { html: best.html, fetchedAt: now, url: best.url, status: best.status };
  if (process.env.NODE_ENV === "development") {
    devLog("selected richest HTML", {
      url: best.url,
      status: best.status,
      htmlSize: best.html.length,
      richness: best.richness,
      parallelScores,
    });
    void saveCricbuzzDebugHtmlSnapshot(best.url, best.html);
  }

  return {
    html: best.html,
    url: best.url,
    status: best.status,
    richness: best.richness,
    parallelScores,
  };
}

export function clearCricbuzzScraperHtmlCacheForTests(): void {
  htmlCache = null;
}

export {
  buildMatchDetailUrls,
  detailUrlsForMatch,
  fetchMatchDetailHtml as fetchCricbuzzMatchDetailHtml,
  clearMatchDetailHtmlCache as clearCricbuzzDetailHtmlCacheForTests,
} from "@/lib/providers/cricbuzz/detail/fetchMatchDetailHtml";
