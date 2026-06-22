import type { Match } from "@/lib/data/matches";
import type { PointsTableRow, SeriesPointsTable, SeriesTopPerformer } from "@/lib/data/series";
import { getMatchPhase } from "@/lib/utils/matchPriority";

export function seriesSlugFromLeague(league: string): string {
  return league
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function matchBelongsToSeries(m: Match, seriesSlug: string): boolean {
  const slug = seriesSlugFromLeague(m.league);
  return slug === seriesSlug || slug.includes(seriesSlug) || seriesSlug.includes(slug);
}

export function partitionSeriesMatches(matches: Match[]): {
  live: Match[];
  upcoming: Match[];
  completed: Match[];
} {
  const live: Match[] = [];
  const upcoming: Match[] = [];
  const completed: Match[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    const phase = getMatchPhase(m);
    if (phase === "live") live.push(m);
    else if (phase === "upcoming") upcoming.push(m);
    else completed.push(m);
  }
  return { live, upcoming, completed };
}

export function inferSeriesFormat(matches: Match[]): string {
  const types = matches.map((m) => m.matchType.toLowerCase()).filter(Boolean);
  if (types.some((t) => /test/.test(t))) return "Test";
  if (types.some((t) => /odi|one.?day|50/.test(t))) return "ODI";
  if (types.some((t) => /t20|20/.test(t))) return "T20I";
  return matches[0]?.matchType?.trim() || "Cricket";
}

export function deriveTopPerformers(matches: Match[]): {
  runs: SeriesTopPerformer[];
  wickets: SeriesTopPerformer[];
} {
  const runsMap = new Map<string, number>();
  const wktsMap = new Map<string, number>();

  for (const m of matches) {
    for (const b of m.batting) {
      const k = b.batter.trim();
      if (!k) continue;
      runsMap.set(k, (runsMap.get(k) ?? 0) + b.runs);
    }
    for (const b of m.bowling) {
      const k = b.bowler.trim();
      if (!k) continue;
      wktsMap.set(k, (wktsMap.get(k) ?? 0) + b.wickets);
    }
  }

  const runs = [...runsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value, label: "runs" }));
  const wickets = [...wktsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value, label: "wkts" }));

  return { runs, wickets };
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function str(v: unknown): string {
  return v === undefined || v === null ? "" : String(v).trim();
}

/** Parse CricketData series_points / standings blobs when present. */
export function parsePointsTablePayload(payload: unknown): SeriesPointsTable | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root.points ?? root.standings ?? root) as unknown;
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.points)
      ? ((data as Record<string, unknown>).points as unknown[])
      : null;
  if (!arr?.length) return null;

  const rows: PointsTableRow[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const team = str(r.teamName ?? r.team ?? r.name ?? r.shortName);
    if (!team) continue;
    rows.push({
      team,
      played: num(r.matches ?? r.played ?? r.p ?? r.mp),
      won: num(r.wins ?? r.won ?? r.w),
      lost: num(r.losses ?? r.lost ?? r.l),
      nr: num(r.nr ?? r.tied ?? r.noresult ?? r.n),
      nrr: str(r.nrr ?? r.netRunRate ?? r.netrr) || "—",
      points: num(r.points ?? r.pts ?? r.pt),
    });
  }
  if (!rows.length) return null;
  const qualifyCount =
    rows.length >= 6 ? 4 : rows.length >= 4 ? 2 : undefined;
  return { rows, qualifyCount };
}
