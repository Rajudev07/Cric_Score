import type { Match } from "@/lib/data/matches";
import type { AggregatedResult } from "@/lib/providers/aggregator";
import {
  getAggregatedLiveMatches,
  getAggregatedLiveMatchesFresh,
  getAggregatedMatchById,
} from "@/lib/providers/aggregator";
import { fetchCricketDataJson } from "@/lib/providers/cricketData/client";
import { transformMatchesListPayload } from "@/lib/providers/cricketData/transform";

export type CricApiResult<T> = AggregatedResult<T>;

function unwrapArray(payload: unknown): unknown[] {
  const data = (() => {
    if (typeof payload !== "object" || payload === null) return payload;
    const r = payload as Record<string, unknown>;
    if ("data" in r && r.data !== undefined) return r.data;
    return payload;
  })();
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    const r = data as Record<string, unknown>;
    if (Array.isArray(r.players)) return r.players;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

export async function getLiveMatches(): Promise<CricApiResult<Match[]>> {
  return getAggregatedLiveMatches("static");
}

export async function getLiveMatchesFresh(): Promise<CricApiResult<Match[]>> {
  return getAggregatedLiveMatchesFresh();
}

export async function getUpcomingMatches(): Promise<CricApiResult<Match[]>> {
  const res = await fetchCricketDataJson("matches", { offset: "0" });
  if (!res.ok) return res;
  const matches = transformMatchesListPayload(res.data);
  return { ok: true, data: matches };
}

export async function getMatchById(id: string): Promise<CricApiResult<Match | null>> {
  return getAggregatedMatchById(id, "static");
}

export async function getMatchByIdFresh(
  id: string
): Promise<CricApiResult<Match | null>> {
  return getAggregatedMatchById(id, "live");
}

export async function searchPlayersByName(
  name: string
): Promise<CricApiResult<Record<string, unknown>[]>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: true, data: [] };
  const res = await fetchCricketDataJson("playerFinder", { name: trimmed });
  if (!res.ok) return res;
  const rows = unwrapArray(res.data).filter(
    (x): x is Record<string, unknown> =>
      typeof x === "object" && x !== null && !Array.isArray(x)
  );
  return { ok: true, data: rows };
}

export type PlayerProfile = {
  id: string;
  name: string;
  country?: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  statsSummary?: string;
  career?: PlayerCareerStats;
};

export type FormatStats = {
  matches: number;
  runs: number;
  avg: number;
  sr: number;
  wickets: number;
  economy: number;
};

export type PlayerCareerStats = {
  all: FormatStats;
  test: FormatStats;
  odi: FormatStats;
  t20: FormatStats;
};

function emptyFormatStats(): FormatStats {
  return { matches: 0, runs: 0, avg: 0, sr: 0, wickets: 0, economy: 0 };
}

function parseFormatBlock(o: Record<string, unknown> | null): FormatStats {
  if (!o) return emptyFormatStats();
  return {
    matches: Number(o.matches ?? o.m ?? o.mp ?? 0) || 0,
    runs: Number(o.runs ?? o.r ?? 0) || 0,
    avg: Number(o.average ?? o.avg ?? o.battingAverage ?? 0) || 0,
    sr: Number(o.strikeRate ?? o.sr ?? o.strikerate ?? 0) || 0,
    wickets: Number(o.wickets ?? o.w ?? o.wkts ?? 0) || 0,
    economy: Number(o.economy ?? o.eco ?? o.econ ?? 0) || 0,
  };
}

function parseCareerStats(rec: Record<string, unknown>): PlayerCareerStats {
  const bat = asRec(rec.batting);
  const bowl = asRec(rec.bowling);
  const stats = asRec(rec.stats);

  const pick = (fmt: string): FormatStats => {
    const b =
      asRec(bat?.[fmt]) ??
      asRec(bat?.[fmt.toUpperCase()]) ??
      asRec(stats?.[`${fmt}Batting`]);
    const w =
      asRec(bowl?.[fmt]) ??
      asRec(bowl?.[fmt.toUpperCase()]) ??
      asRec(stats?.[`${fmt}Bowling`]);
    const bf = parseFormatBlock(b);
    const wf = parseFormatBlock(w);
    return {
      matches: bf.matches || wf.matches,
      runs: bf.runs,
      avg: bf.avg,
      sr: bf.sr,
      wickets: wf.wickets,
      economy: wf.economy,
    };
  };

  const test = pick("test");
  const odi = pick("odi");
  const t20i = pick("t20i");
  const t20 = t20i.matches ? t20i : pick("t20");
  const all = parseFormatBlock(asRec(rec.overall) ?? asRec(rec.career) ?? rec);
  if (!all.matches) {
    all.matches = test.matches + odi.matches + t20.matches;
    all.runs = test.runs + odi.runs + t20.runs;
    all.wickets = test.wickets + odi.wickets + t20.wickets;
  }
  return { all, test, odi, t20 };
}

function asRec(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function pickStr(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export async function getPlayerProfile(
  playerId: string
): Promise<CricApiResult<PlayerProfile | null>> {
  const pid = playerId.trim();
  if (!pid) return { ok: true, data: null };

  const tryPaths: { path: string; params: Record<string, string> }[] = [
    { path: "player_info", params: { pid } },
    { path: "playerStats", params: { pid } },
    { path: "players", params: { id: pid } },
  ];

  for (const { path, params } of tryPaths) {
    const res = await fetchCricketDataJson(path, params);
    if (!res.ok) continue;
    const raw = res.data;
    const rec =
      typeof raw === "object" &&
      raw !== null &&
      "data" in (raw as Record<string, unknown>) &&
      typeof (raw as Record<string, unknown>).data === "object" &&
      (raw as Record<string, unknown>).data !== null
        ? ((raw as Record<string, unknown>).data as Record<string, unknown>)
        : (raw as Record<string, unknown>);

    if (!rec || typeof rec !== "object") continue;

    const name =
      pickStr(rec, "name", "fullName", "playerName") ?? `Player ${pid}`;
    const profile: PlayerProfile = {
      id: pid,
      name,
      country: pickStr(rec, "country", "team", "countryName"),
      role: pickStr(rec, "playingRole", "role", "playerType"),
      battingStyle: pickStr(rec, "battingStyle", "batStyle"),
      bowlingStyle: pickStr(rec, "bowlingStyle", "bowlStyle"),
      statsSummary: pickStr(rec, "profile", "bio")?.slice(0, 400),
      career: parseCareerStats(rec),
    };
    return { ok: true, data: profile };
  }

  return { ok: true, data: null };
}

export async function getSeriesStandings(
  seriesName: string
): Promise<CricApiResult<import("@/lib/data/series").SeriesPointsTable | null>> {
  const name = seriesName.trim();
  if (!name) return { ok: true, data: null };
  const attempts: Record<string, string>[] = [
    { series: name },
    { name },
  ];
  const paths = ["series_points", "series_points", "series_info"];
  for (let i = 0; i < paths.length; i++) {
    const res = await fetchCricketDataJson(paths[i]!, attempts[i % attempts.length]!);
    if (!res.ok) continue;
    const { parsePointsTablePayload } = await import("@/lib/utils/series");
    const table = parsePointsTablePayload(res.data);
    if (table) return { ok: true, data: table };
  }
  return { ok: true, data: null };
}
