import type { Match } from "@/lib/data/matches";
import { unwrapData } from "@/lib/providers/cricketData/transform";
import { debugForceLiveIngestEnabled, ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";
import { explainIplSignals } from "@/lib/utils/iplDetection";

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

export function logTransformedMatchRow(stage: string, m: Match): void {
  if (!ingestDebugEnabled() || !isIngestRowDebugTarget(m)) return;
  const ipl = explainIplSignals(`${m.league} ${m.team1} ${m.team2} ${m.matchType} ${m.status}`);
  console.log(`[cricscore:ingest-row] ${stage}`, {
    id: m.id,
    team1: m.team1,
    team2: m.team2,
    league: m.league,
    matchType: m.matchType,
    status: m.status.slice(0, 120),
    isLive: m.isLive,
    matchStarted: m.matchStarted,
    matchEnded: m.matchEnded,
    startTimeIso: m.startTimeIso,
    score1: m.score1,
    score2: m.score2,
    overs: m.overs,
    provider: m.provider,
    iplExplain: ipl,
  });
}

export function logRawCricketDataPayload(stage: string, payload: unknown): void {
  if (!ingestDebugEnabled()) return;
  const data = unwrapData(payload);
  if (!Array.isArray(data)) {
    console.log(`[cricscore:ingest-raw-cd] ${stage} non-array`, typeof data);
    return;
  }
  for (const item of data) {
    const blob = JSON.stringify(item).toLowerCase();
    if (
      !blob.includes("dc") &&
      !blob.includes("delhi") &&
      !blob.includes("rr") &&
      !blob.includes("rajasthan") &&
      !blob.includes("ipl") &&
      !blob.includes("indian") &&
      !blob.includes("t20 league")
    ) {
      continue;
    }
    const rec = item as Record<string, unknown>;
    console.log(`[cricscore:ingest-raw-cd] ${stage}`, {
      id: rec.id ?? rec.unique_id ?? rec.match_id,
      name: rec.name ?? rec.title,
      status: rec.status ?? rec.matchstatus ?? rec.state,
      series: rec.seriesName ?? (rec.series as { name?: string })?.name,
      type: rec.type ?? rec.matchType,
      rawSnippet: JSON.stringify(item).slice(0, 500),
    });
  }
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
