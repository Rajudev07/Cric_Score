import {
  detectCricbuzzBlockedHtml,
  effectiveHtmlScore,
  hasMatchInfoString,
  hasNextDataScript,
  scoreHtmlRichness,
} from "@/lib/providers/cricbuzzScraper/cricbuzzHtmlQuality";
import { cricbuzzBrowserHeaders } from "@/lib/providers/cricbuzz/sharedRequestHeaders";

const DETAIL_TTL_MS = 18_000;

const detailHtmlCache = new Map<
  string,
  { html: string; url: string; fetchedAt: number; status: number }
>();

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[cricscore:cricbuzz-scraper:client]", ...args);
  }
}

function slugPart(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
}

/**
 * All candidate Cricbuzz match-detail URLs (numeric id + optional team-slug variants).
 */
export function buildMatchDetailUrls(
  matchId: string,
  opts?: { team1?: string; team2?: string }
): string[] {
  const id = matchId.trim();
  const urls: string[] = [
    `https://www.cricbuzz.com/live-cricket-scores/${id}`,
    `https://www.cricbuzz.com/cricket-scores/${id}`,
    `https://www.cricbuzz.com/live-cricket-scorecard/${id}`,
    `https://www.cricbuzz.com/live-cricket-full-commentary/${id}`,
    `https://www.cricbuzz.com/cricket-match/${id}/live-cricket-score`,
    `https://www.cricbuzz.com/cricket-match/${id}/full-scorecard`,
    `https://www.cricbuzz.com/cricket-match/${id}/live-cricket-commentary`,
    `https://m.cricbuzz.com/cricket-match/${id}/live-cricket-score/full-scorecard`,
  ];
  const t1 = opts?.team1?.trim();
  const t2 = opts?.team2?.trim();
  if (t1 && t2) {
    const slug = `${slugPart(t1)}-vs-${slugPart(t2)}`;
    urls.push(
      `https://www.cricbuzz.com/cricket-match/${slug}/${id}/live-cricket-score`,
      `https://www.cricbuzz.com/cricket-match/${slug}/${id}/live-cricket-commentary`
    );
  }
  return [...new Set(urls)];
}

/** @deprecated name — use buildMatchDetailUrls */
export function detailUrlsForMatch(matchId: string): string[] {
  return buildMatchDetailUrls(matchId);
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

function pickBestDetailHtml(
  pairs: { url: string; html: string; status: number }[]
): { html: string; url: string; status: number; effective: number } | null {
  if (!pairs.length) return null;
  let best: { html: string; url: string; status: number; effective: number } | null = null;
  for (const p of pairs) {
    const eff = effectiveHtmlScore(p.html);
    if (
      !best ||
      eff > best.effective ||
      (eff === best.effective && p.html.length > best.html.length)
    ) {
      best = { ...p, effective: eff };
    }
  }
  return best;
}

/**
 * Parallel-fetch match detail HTML; pick richest hydration (NEXT_DATA, scorecard, commentary).
 */
export async function fetchMatchDetailHtml(
  matchId: string,
  opts?: { team1?: string; team2?: string }
): Promise<{ html: string; url: string; status: number } | null> {
  const key = matchId.trim();
  if (!key) return null;
  const now = Date.now();
  const cached = detailHtmlCache.get(key);
  if (cached && now - cached.fetchedAt < DETAIL_TTL_MS) {
    if (process.env.NODE_ENV === "development") {
      devLog("detail cache hit", key, cached.url, "ageMs", now - cached.fetchedAt);
    }
    return { html: cached.html, url: cached.url, status: cached.status };
  }

  const urls = buildMatchDetailUrls(key, opts);
  const settled = await Promise.all(urls.map((u) => fetchHtmlOnce(u)));

  const pairs: { url: string; html: string; status: number }[] = [];
  for (let i = 0; i < urls.length; i++) {
    const got = settled[i];
    if (!got || got.html.length < 900) continue;
    pairs.push({ url: urls[i]!, html: got.html, status: got.status });
  }

  if (!pairs.length) {
    for (let i = 0; i < urls.length; i++) {
      const got = settled[i];
      if (got && got.html.length >= 200) {
        pairs.push({ url: urls[i]!, html: got.html, status: got.status });
      }
    }
  }

  const best = pickBestDetailHtml(pairs);
  if (!best) {
    return null;
  }

  const blocked = detectCricbuzzBlockedHtml(best.html);
  devLog("detail fetch selected", {
    url: best.url,
    status: best.status,
    htmlSize: best.html.length,
    richness: scoreHtmlRichness(best.html),
    effective: best.effective,
    nextData: hasNextDataScript(best.html),
    matchInfo: hasMatchInfoString(best.html),
    blocked,
  });

  detailHtmlCache.set(key, { html: best.html, url: best.url, fetchedAt: now, status: best.status });
  return { html: best.html, url: best.url, status: best.status };
}

export function clearMatchDetailHtmlCache(): void {
  detailHtmlCache.clear();
}
