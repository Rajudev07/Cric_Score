import type { Match } from "@/lib/data/matches";

const STATUS_STRONG =
  /\b(need|trail|require|target|innings break|stumps|day\s+\d+|live|in progress|strategic timeout|drinks|powerplay|super over|opt to|elected)\b/i;

function hasRealScore(score: string | undefined): boolean {
  const s = score?.trim() ?? "";
  return s.length > 0 && s !== "—" && !/^[\s—]+$/u.test(s);
}

function hasRealOvers(overs: string | undefined): boolean {
  const o = overs?.trim() ?? "";
  return o.length > 0 && o !== "—" && /\d/.test(o);
}

/**
 * Strong live scoreboard / play signals — when true, stale rules and
 * "upcoming" downgrade must not suppress this row.
 */
export function hasStrongLiveSignals(m: Match): boolean {
  if (hasRealOvers(m.overs)) return true;
  if (hasRealScore(m.score1) || hasRealScore(m.score2)) return true;
  if (STATUS_STRONG.test(m.status)) return true;
  if (m.commentary.length > 0) return true;
  for (const c of m.commentary.slice(-40)) {
    if (/\d+\.\d+/.test(`${c.over} ${c.text}`)) return true;
  }
  if (m.isLive && (hasRealScore(m.score1) || hasRealScore(m.score2) || hasRealOvers(m.overs))) return true;
  if (m.matchStarted && (hasRealScore(m.score1) || hasRealScore(m.score2) || hasRealOvers(m.overs))) {
    return true;
  }
  return false;
}
