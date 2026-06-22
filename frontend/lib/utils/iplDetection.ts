/**
 * Case-insensitive IPL / franchise-league detection for prioritization and dedupe.
 */

import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";

type IplPattern = { name: string; re: RegExp };

const IPL_PATTERNS: IplPattern[] = [
  { name: "ipl_word", re: /\bipl\b/i },
  { name: "indian_premier_league", re: /\bindian premier league\b/i },
  { name: "tata_ipl", re: /\btata\s*ipl\b/i },
  { name: "t20_league", re: /\bindian\s+t20\s+league\b/i },
  { name: "ipl_year", re: /\bipl\s*20\d{2}\b/i },
  { name: "year_ipl", re: /\b20\d{2}\s*ipl\b/i },
  { name: "league_t20", re: /\bleague[-\s]?t20\b/i },
  { name: "delhi_capitals", re: /\bdelhi capitals\b/i },
  { name: "rajasthan_royals", re: /\brajasthan royals\b/i },
];

export function explainIplSignals(text: string): {
  matched: boolean;
  normalized: string;
  reason: string;
  inputSample: string;
} {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const inputSample = text.slice(0, 280);
  for (const { name, re } of IPL_PATTERNS) {
    if (re.test(normalized)) {
      return { matched: true, normalized, reason: name, inputSample };
    }
  }
  return { matched: false, normalized, reason: "none", inputSample };
}

function shouldLogIplDetect(text: string): boolean {
  if (!ingestDebugEnabled()) return false;
  const h = text.toLowerCase();
  return (
    (h.includes("delhi") && h.includes("rajasthan")) ||
    (h.includes("capitals") && h.includes("royals")) ||
    (/\bdc\b/.test(h) && /\brr\b/.test(h)) ||
    h.includes("ipl") ||
    h.includes("tata") ||
    h.includes("t20 league") ||
    h.includes("indian premier") ||
    h.includes("premier league")
  );
}

export function containsIplSignals(text: string, opts?: { silent?: boolean }): boolean {
  const explained = explainIplSignals(text);
  if (!opts?.silent && shouldLogIplDetect(text)) {
    console.log("[cricscore:ipl-detect]", explained);
  }
  return explained.matched;
}

export function countIplMatches(matches: { league: string; team1: string; team2: string; status: string }[]): number {
  return matches.filter((m) =>
    containsIplSignals(`${m.league} ${m.team1} ${m.team2} ${m.status}`, { silent: true })
  ).length;
}
