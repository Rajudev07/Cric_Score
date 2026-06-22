import { extractNumericMatchIdFromUrl } from "@/lib/providers/cricbuzz/discovery/normalizeMatchLink";
import { isRejectableCricbuzzUrl, isPreferredLiveUrl } from "@/lib/providers/cricbuzz/discovery/validateMatchLink";

export type LiveMatchLinkRef = {
  url: string;
  matchId: string;
  liveHint: boolean;
  source: string;
};

function absolutize(href: string): string | null {
  const h = href.trim();
  if (!h) return null;
  if (h.startsWith("//")) return `https:${h}`;
  if (h.startsWith("http")) return h;
  if (h.startsWith("/")) return `https://www.cricbuzz.com${h.split("#")[0]}`;
  return null;
}

function liveBlobHint(text: string): boolean {
  return (
    /"state"\s*:\s*"(?:LIVE|Live|In Progress|In-Progress)"/i.test(text) ||
    /"matchState"\s*:\s*"(?:LIVE|Live)"/i.test(text) ||
    /"isMatchLive"\s*:\s*true/i.test(text) ||
    /"status"\s*:\s*"[^"]*\b(?:live|in progress|stumps|innings break)\b/i.test(text) ||
    /\bLIVE\b/.test(text)
  );
}

/** Scan raw HTML for Cricbuzz match URLs and embedded ids. */
export function extractLiveMatchLinks(html: string, source: string): LiveMatchLinkRef[] {
  const out: LiveMatchLinkRef[] = [];
  const seen = new Set<string>();
  const pageLive = liveBlobHint(html.slice(0, 180_000));

  const push = (url: string, ctx: string) => {
    const abs = absolutize(url);
    if (!abs || isRejectableCricbuzzUrl(abs)) return;
    const matchId = extractNumericMatchIdFromUrl(abs);
    if (!matchId) return;
    const key = `${matchId}|${abs.split("?")[0]}`;
    if (seen.has(key)) return;
    seen.add(key);
    const slice = `${ctx} ${abs}`.slice(0, 500);
    out.push({
      url: abs,
      matchId,
      liveHint: liveBlobHint(slice) || pageLive,
      source,
    });
  };

  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) {
    push(m[1]!, "href");
  }

  const urlRe =
    /https?:\/\/(?:www\.|m\.)?cricbuzz\.com\/[a-z0-9\-_/]+(?:\d{5,12})[a-z0-9\-_/]*/gi;
  let u: RegExpExecArray | null;
  while ((u = urlRe.exec(html)) !== null) {
    push(u[0]!, "blob");
  }

  const idRe = /"matchId"\s*:\s*(\d{5,12})/g;
  let idm: RegExpExecArray | null;
  while ((idm = idRe.exec(html)) !== null) {
    const matchId = idm[1]!;
    const ctxStart = Math.max(0, idm.index - 320);
    const ctx = html.slice(ctxStart, idm.index + 120);
    const live = liveBlobHint(ctx);
    push(
      live
        ? `https://www.cricbuzz.com/cricket-match/${matchId}/live-cricket-score`
        : `https://www.cricbuzz.com/live-cricket-scores/${matchId}`,
      "json_matchId"
    );
  }

  const livePatterns: RegExp[] = [
    /"state"\s*:\s*"LIVE"[^}]{0,600}?"matchId"\s*:\s*(\d{5,12})/gi,
    /"matchState"\s*:\s*"LIVE"[^}]{0,600}?"matchId"\s*:\s*(\d{5,12})/gi,
    /"isMatchLive"\s*:\s*true[^}]{0,600}?"matchId"\s*:\s*(\d{5,12})/gi,
    /"matchId"\s*:\s*(\d{5,12})[^}]{0,600}?"state"\s*:\s*"LIVE"/gi,
    /"matchId"\s*:\s*(\d{5,12})[^}]{0,600}?"matchState"\s*:\s*"LIVE"/gi,
  ];
  for (const re of livePatterns) {
    re.lastIndex = 0;
    while ((idm = re.exec(html)) !== null) {
      const matchId = idm[1]!;
      push(`https://www.cricbuzz.com/cricket-match/${matchId}/live-cricket-score`, "json_live");
    }
  }

  const seriesLive =
    /"seriesMatches"\s*:\s*\[[\s\S]{0,8000}?"matchId"\s*:\s*(\d{5,12})/gi;
  while ((idm = seriesLive.exec(html)) !== null) {
    const matchId = idm[1]!;
    const ctxStart = Math.max(0, idm.index - 200);
    const ctx = html.slice(ctxStart, idm.index + 400);
    if (liveBlobHint(ctx)) {
      push(`https://www.cricbuzz.com/cricket-match/${matchId}/live-cricket-score`, "series_live");
    }
  }

  return out.sort((a, b) => {
    const pa = (a.liveHint ? 4 : 0) + (isPreferredLiveUrl(a.url) ? 2 : 0);
    const pb = (b.liveHint ? 4 : 0) + (isPreferredLiveUrl(b.url) ? 2 : 0);
    return pb - pa;
  });
}
