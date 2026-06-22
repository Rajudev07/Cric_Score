import type { Match } from "@/lib/data/matches";
import { parseBallEventsFromCommentary } from "@/lib/utils/liveMatchDerived";
import { estimateWinProbability } from "@/lib/intelligence/winProbability";
import { computeMomentum } from "@/lib/utils/momentum";
import { buildRecentOvers } from "@/lib/utils/liveMatchDerived";

const TOP_EIGHT = new Set([
  "india",
  "australia",
  "england",
  "south africa",
  "new zealand",
  "pakistan",
  "sri lanka",
  "west indies",
]);

const CODE_MAP: Record<string, string> = {
  india: "IN",
  australia: "AU",
  england: "GB",
  "south africa": "ZA",
  "new zealand": "NZ",
  pakistan: "PK",
  "sri lanka": "LK",
  "west indies": "WI",
  bangladesh: "BD",
  afghanistan: "AF",
};

function teamKey(name: string): string {
  return name.toLowerCase().trim();
}

export function isHighProfileFeaturedMatch(m: Match): boolean {
  if (!m.isLive) return false;
  const mt = m.matchType.toLowerCase();
  const league = m.league.toLowerCase();
  if (/test/.test(mt)) return true;
  if (/\bicc\b|world cup|champions trophy|asia cup|wtc|world test/i.test(league)) return true;
  const t1 = teamKey(m.team1);
  const t2 = teamKey(m.team2);
  const topPair =
    [...TOP_EIGHT].some((t) => t1.includes(t) || t1 === t.slice(0, 3)) &&
    [...TOP_EIGHT].some((t) => t2.includes(t) || t2 === t.slice(0, 3));
  return topPair;
}

export function countryCodeForTeam(name: string): string | null {
  const k = teamKey(name);
  for (const [full, code] of Object.entries(CODE_MAP)) {
    if (k.includes(full) || k === full.slice(0, 3)) return code;
  }
  if (k.length === 3 && /^[a-z]{3}$/i.test(k)) return k.toUpperCase();
  return null;
}

export function flagEmoji(countryCode: string): string {
  const cc = countryCode.toUpperCase();
  if (cc.length !== 2) return "🏏";
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}

export function featuredMatchDerived(m: Match) {
  const events = parseBallEventsFromCommentary(m.commentary);
  const recent = buildRecentOvers(events, 1);
  const lastOverBalls = recent[0]?.balls.slice(-6) ?? [];
  const momentum = computeMomentum(m, events);
  const winProb = estimateWinProbability(m, events, momentum, recent);
  const need = m.status.match(/need\s+(\d+)\s+from\s+(\d+)/i);
  const reqRate = need
    ? ((parseInt(need[1]!, 10) / parseInt(need[2]!, 10)) * 6).toFixed(2)
    : null;
  const currRate = m.overs && m.overs !== "—" ? m.status.match(/(\d+\.?\d*)\s*rpo/i)?.[1] : null;
  return { lastOverBalls, winProb, reqRate, currRate };
}
