import { extractMatchDetailPayload } from "@/lib/providers/cricbuzz/detail/extractMatchDetailPayload";
import {
  buildMatchDetailUrls,
  fetchMatchDetailHtml,
} from "@/lib/providers/cricbuzz/detail/fetchMatchDetailHtml";
import { cricbuzzBrowserHeaders } from "@/lib/providers/cricbuzz/sharedRequestHeaders";
import { scoreHtmlRichness } from "@/lib/providers/cricbuzzScraper/cricbuzzHtmlQuality";
import {
  type MatchDetailEnrichment,
  transformMatchDetail,
} from "@/lib/providers/cricbuzz/detail/transformMatchDetail";

export type { MatchDetailEnrichment };

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[cricscore:cricbuzz-scraper:detail]", ...args);
  }
}

/** Resolve numeric Cricbuzz match id from route param (cricketdata id or cbz(s)- prefix). */
export function extractCricbuzzNumericMatchId(routeId: string): string | null {
  const t = routeId.trim();
  const stripped = t.replace(/^cbzs?-/i, "");
  if (/^\d+$/.test(stripped)) return stripped;
  if (/^\d+$/.test(t)) return t;
  return null;
}

async function fetchHtmlOnce(url: string): Promise<{ html: string; status: number } | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: cricbuzzBrowserHeaders(),
      next: { revalidate: 0 },
    });
    const html = await res.text();
    if (!res.ok) return null;
    return { html, status: res.status };
  } catch {
    return null;
  }
}

/**
 * Fetch commentary + scorecard pages and merge JSON roots for richer detail parsing.
 */
async function fetchMergedDetailRoots(
  cricbuzzMatchId: string,
  opts?: { team1?: string; team2?: string; primaryHtml?: string }
): Promise<{ roots: unknown[]; detailUrl: string; extractionStrategies: string[] } | null> {
  const urls = buildMatchDetailUrls(cricbuzzMatchId, opts);
  const priority = [
    urls.find((u) => /commentary/i.test(u)),
    urls.find((u) => /scorecard/i.test(u)),
    urls.find((u) => /live-cricket-score/i.test(u)),
    urls[0],
  ].filter((u): u is string => Boolean(u));
  const toFetch = [...new Set(priority)].slice(0, 3);

  const settled = await Promise.all(toFetch.map((u) => fetchHtmlOnce(u)));
  const pages: { url: string; html: string; score: number }[] = [];
  if (opts?.primaryHtml && opts.primaryHtml.length >= 900) {
    pages.push({
      url: "primary-cache",
      html: opts.primaryHtml,
      score: scoreHtmlRichness(opts.primaryHtml),
    });
  }
  for (let i = 0; i < toFetch.length; i++) {
    const got = settled[i];
    if (!got || got.html.length < 500) continue;
    pages.push({ url: toFetch[i]!, html: got.html, score: scoreHtmlRichness(got.html) });
  }
  if (!pages.length) return null;

  pages.sort((a, b) => b.score - a.score || b.html.length - a.html.length);
  const mergedRoots: unknown[] = [];
  const seenSer = new Set<string>();
  const strategies = new Set<string>();
  let detailUrl = pages[0]!.url;

  for (const page of pages.slice(0, 3)) {
    try {
      const payload = extractMatchDetailPayload(page.html);
      if (payload.extractionStrategies.length) {
        for (const s of payload.extractionStrategies) strategies.add(s);
      }
      for (const root of payload.roots) {
        try {
          const ser = JSON.stringify(root);
          if (ser.length < 40 || seenSer.has(ser)) continue;
          seenSer.add(ser);
          mergedRoots.push(root);
        } catch {
          mergedRoots.push(root);
        }
      }
    } catch {
      /* try next page */
    }
  }

  if (!mergedRoots.length) return null;
  return {
    roots: mergedRoots,
    detailUrl,
    extractionStrategies: [...strategies],
  };
}

/**
 * Server-only: fetch match HTML, extract JSON, parse scorecard + commentary.
 */
export async function scrapeMatchDetail(
  cricbuzzMatchId: string,
  opts?: { team1?: string; team2?: string }
): Promise<MatchDetailEnrichment | null> {
  try {
    const got = await fetchMatchDetailHtml(cricbuzzMatchId, {
      team1: opts?.team1,
      team2: opts?.team2,
    });

    const merged = await fetchMergedDetailRoots(cricbuzzMatchId, {
      team1: opts?.team1,
      team2: opts?.team2,
      primaryHtml: got?.html,
    });
    if (!merged) {
      devLog("no detail HTML", cricbuzzMatchId);
      return null;
    }

    const enrichment = transformMatchDetail(merged.roots, {
      extractionSource: merged.extractionStrategies.join("+") || "none",
      detailUrl: got?.url ?? merged.detailUrl,
    });

    const { batting, bowling, commentary } = enrichment;

    if (process.env.NODE_ENV === "development") {
      devLog("detail scrape ok", {
        matchId: cricbuzzMatchId,
        pageUrl: got?.url ?? merged.detailUrl,
        htmlSize: got?.html.length ?? 0,
        jsonRoots: merged.roots.length,
        battingRows: batting.length,
        bowlingRows: bowling.length,
        commentaryRows: commentary.length,
      });
    }

    if (!batting.length && !bowling.length && !commentary.length) {
      return null;
    }

    return { batting, bowling, commentary };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      devLog("scrapeMatchDetail error", e instanceof Error ? e.message : String(e));
    }
    return null;
  }
}
