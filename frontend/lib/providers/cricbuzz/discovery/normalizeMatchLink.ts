/**
 * Extract numeric Cricbuzz match id from known URL shapes (www / m, slugs, query).
 */
export function extractNumericMatchIdFromUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const path = u.pathname;
  const patterns: RegExp[] = [
    /\/live-cricket-scores\/(\d{5,12})(?:\/|$)/i,
    /\/cricket-scores\/(\d{5,12})(?:\/|$)/i,
    /\/live-cricket-scorecard\/(\d{5,12})(?:\/|$)/i,
    /\/live-cricket-full-commentary\/(\d{5,12})(?:\/|$)/i,
    /\/cricket-match\/(\d{5,12})(?:\/|$)/i,
    /\/cricket-match\/[^/]+\/(\d{5,12})(?:\/|$)/i,
    /\/live-cricket-scores\/[^/]+\/(\d{5,12})(?:\/|$)/i,
  ];
  for (const re of patterns) {
    const m = path.match(re);
    if (m?.[1]) return m[1];
  }
  const q = u.searchParams.get("id") ?? u.searchParams.get("matchId");
  if (q && /^\d{5,12}$/.test(q)) return q;
  return null;
}

export type CanonicalMatchUrls = {
  matchId: string;
  live: string;
  scorecard: string;
  commentary: string;
};

/** Canonical fetch URLs for a numeric match id (same family as detail scraper). */
export function buildCanonicalFetchUrls(matchId: string): CanonicalMatchUrls {
  const id = matchId.trim();
  return {
    matchId: id,
    live: `https://www.cricbuzz.com/live-cricket-scores/${id}`,
    scorecard: `https://www.cricbuzz.com/cricket-match/${id}/full-scorecard`,
    commentary: `https://www.cricbuzz.com/cricket-match/${id}/live-cricket-commentary`,
  };
}

/** Ordered for richness: commentary & scorecard pages hydrate comm/scorecard JSON best. */
export function prioritizedFetchUrls(matchId: string): string[] {
  const c = buildCanonicalFetchUrls(matchId);
  return [
    c.commentary,
    `https://www.cricbuzz.com/cricket-match/${matchId}/live-cricket-score`,
    c.scorecard,
    c.live,
    `https://www.cricbuzz.com/cricket-scores/${matchId}`,
    `https://www.cricbuzz.com/live-cricket-scorecard/${matchId}`,
    `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}`,
    `https://m.cricbuzz.com/cricket-match/${matchId}/live-cricket-score/full-scorecard`,
  ];
}
