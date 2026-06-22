/** Heuristics for Cricbuzz HTML fetch quality (anti-bot / hydration). */

export type CricbuzzBlockedSignals = {
  accessDenied: boolean;
  captcha: boolean;
  enableJavascript: boolean;
};

export function detectCricbuzzBlockedHtml(html: string): CricbuzzBlockedSignals {
  const lower = html.toLowerCase();
  return {
    accessDenied: /access denied/i.test(html),
    captcha: /\bcaptcha\b/i.test(lower),
    enableJavascript:
      /\benable javascript\b/i.test(lower) ||
      /\bplease enable javascript\b/i.test(lower) ||
      /\bjavascript is (disabled|required)\b/i.test(lower),
  };
}

export function hasNextDataScript(html: string): boolean {
  return /<script[^>]*\bid=["']__NEXT_DATA__["']/i.test(html);
}

export function hasMatchInfoString(html: string): boolean {
  return /matchInfo/.test(html);
}

/**
 * Prefer HTML that carries Next hydration + match payloads.
 */
export function scoreHtmlRichness(html: string): number {
  let score = 0;
  if (hasNextDataScript(html)) score += 40;
  if (/__NEXT_DATA__\s*=/.test(html)) score += 25;
  if (/pageProps/.test(html)) score += 12;
  if (/appIndex/.test(html)) score += 8;
  if (/matchInfo/.test(html)) score += 18;
  if (/team1/.test(html)) score += 6;
  if (/team2/.test(html)) score += 6;
  if (/matchScore|"matchScore"|"score"\s*:/.test(html)) score += 8;
  if (/commentary|commText|commLines/i.test(html)) score += 10;
  if (/scoreCard|scorecard|batsman|batsmen/i.test(html)) score += 10;
  if (/recentOvers|overSummary|inningsOvers/i.test(html)) score += 6;
  const blocked = detectCricbuzzBlockedHtml(html);
  if (blocked.accessDenied || blocked.captcha) score -= 120;
  if (blocked.enableJavascript) score -= 40;
  return score;
}

export function effectiveHtmlScore(html: string): number {
  return scoreHtmlRichness(html) + Math.min(html.length / 50_000, 4);
}
