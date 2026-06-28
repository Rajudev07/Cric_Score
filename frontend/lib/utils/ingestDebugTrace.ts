import type { Match } from "@/lib/data/matches";
import { debugForceLiveIngestEnabled } from "@/lib/utils/ingestDebugFlags";

export { ingestDebugEnabled, debugForceLiveIngestEnabled } from "@/lib/utils/ingestDebugFlags";

/** DC vs RR or tournament/IPL-ish rows — broad server/client trace filter */
export function isIngestRowDebugTarget(m: Pick<Match, "team1" | "team2" | "league" | "status" | "matchType">): boolean {
  const teams = `${m.team1} ${m.team2}`.toLowerCase();
  const league = m.league.toLowerCase();
  const st = m.status.toLowerCase();
  const mt = m.matchType.toLowerCase();
  const blob = `${teams} ${league} ${st} ${mt}`;
  const dc =
    teams.includes("delhi capitals") ||
    /\bdc\b/.test(teams) ||
    (teams.includes("delhi") && teams.includes("capitals"));
  const rr =
    teams.includes("rajasthan royals") ||
    /\brr\b/.test(teams) ||
    (teams.includes("rajasthan") && teams.includes("royals"));
  const tour =
    league.includes("ipl") ||
    league.includes("indian") ||
    league.includes("t20 league") ||
    st.includes("ipl") ||
    st.includes("indian") ||
    st.includes("t20 league");
  return (dc && rr) || tour || teams.includes("dc") || teams.includes("rr") || blob.includes("ipl");
}

export function isDcRrFixture(m: Pick<Match, "team1" | "team2">): boolean {
  const t = `${m.team1} ${m.team2}`.toLowerCase();
  const hasDc =
    t.includes("delhi capitals") ||
    /\bdc\b/.test(t) ||
    (t.includes("delhi") && t.includes("capitals"));
  const hasRr =
    t.includes("rajasthan royals") ||
    /\brr\b/.test(t) ||
    (t.includes("rajasthan") && t.includes("royals"));
  return hasDc && hasRr;
}

export function logTransformedMatchRow(_stage: string, _m: Match): void {
  return;
}

export function logRawCricketDataPayload(_stage: string, _payload: unknown): void {
  return;
}

export function applyIngestDebugLiveOverride(m: Match): Match {
  if (!debugForceLiveIngestEnabled()) return m;
  const s = m.status.toLowerCase();
  const hasOvers = Boolean(m.overs && m.overs !== "—" && m.overs.trim() !== "");
  const hasInningsScore =
    (m.score1 && m.score1 !== "—") || (m.score2 && m.score2 !== "—");
  if (s.includes("need") || s.includes("opt to") || hasOvers || hasInningsScore) {
    return { ...m, isLive: true, matchStarted: true };
  }
  return m;
}
