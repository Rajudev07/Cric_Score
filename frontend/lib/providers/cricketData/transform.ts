import type {
  BattingRow,
  BowlingRow,
  CommentaryItem,
  Match,
} from "@/lib/data/matches";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function teamLabel(team: unknown): string {
  const o = asRecord(team);
  if (o) {
    return str(o.shortname ?? o.shortName ?? o.name ?? o.teamName ?? o.short_name);
  }
  return str(team, "Team");
}

function extractTeams(raw: Record<string, unknown>): [string, string] {
  const teams = raw.teams;
  if (Array.isArray(teams) && teams.length >= 2) {
    return [teamLabel(teams[0]), teamLabel(teams[1])];
  }

  const ti = raw.teamInfo;
  if (Array.isArray(ti) && ti.length >= 2) {
    return [teamLabel(ti[0]), teamLabel(ti[1])];
  }
  if (ti && typeof ti === "object" && !Array.isArray(ti)) {
    const vals = Object.values(ti);
    if (vals.length >= 2) {
      return [teamLabel(vals[0]), teamLabel(vals[1])];
    }
  }

  const name = str(raw.name);
  const parts = name.split(/\s+vs\.?\s+/i);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts[1].trim()];
  }

  const t1 = str(raw["team-1"] ?? raw.team1 ?? raw.team_1);
  const t2 = str(raw["team-2"] ?? raw.team2 ?? raw.team_2);
  if (t1 && t2) return [t1, t2];

  return ["Team 1", "Team 2"];
}

function formatInningsScore(inn?: Record<string, unknown>): string {
  if (!inn) return "—";
  const r = inn.r ?? inn.runs;
  const w = inn.w ?? inn.wickets;
  if (r === undefined && w === undefined) return "—";
  return `${num(r)}/${num(w)}`;
}

function extractScores(raw: Record<string, unknown>): {
  score1: string;
  score2: string;
  overs: string;
} {
  const score = raw.score;
  if (!Array.isArray(score) || score.length === 0) {
    return { score1: "—", score2: "—", overs: "—" };
  }

  const first = asRecord(score[0]);
  const second = score.length > 1 ? asRecord(score[1]) : undefined;

  const oversRaw =
    score.length > 0
      ? asRecord(score[score.length - 1])?.o ??
        asRecord(score[score.length - 1])?.overs
      : undefined;

  const overs =
    oversRaw !== undefined && oversRaw !== null
      ? String(oversRaw)
      : first?.o !== undefined
        ? String(first.o)
        : "—";

  return {
    score1: formatInningsScore(first ?? undefined),
    score2: formatInningsScore(second ?? undefined),
    overs,
  };
}

function deriveLeague(raw: Record<string, unknown>): string {
  const series = asRecord(raw.series);
  const seriesName =
    str(series?.name) ||
    str(raw.seriesName) ||
    (typeof raw.series === "string" ? str(raw.series) : "");
  const matchType =
    str(raw.matchType) ||
    str(raw.type) ||
    str(series?.matchType) ||
    "";

  const t = matchType.toLowerCase();
  const s = seriesName.toLowerCase();

  if (t.includes("test")) return "test";
  if (t.includes("odi")) return "odi";
  if (t.includes("t20i")) return "t20i";
  if (t.includes("t20")) return "t20";

  if (s.includes("test")) return "test";
  if (s.includes("odi") || s.includes("one day")) return "odi";
  if (s.includes("t20i") || s.includes("twenty20 international")) return "t20i";
  if (s.includes("t20") || s.includes("twenty20")) return "t20";

  return "t20";
}

function isCompletedStatusText(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s.includes("won") ||
    s.includes("win by") ||
    s.includes("won by") ||
    s.includes("tied") ||
    s.includes("tie ") ||
    s.includes("match tied") ||
    s.includes("abandon") ||
    s.includes("no result") ||
    s.includes("draw") ||
    s.includes("beat ") ||
    s.includes("defeat")
  );
}

function deriveEnded(raw: Record<string, unknown>): boolean {
  if (raw.matchEnded === true) return true;
  return isCompletedStatusText(str(raw.status));
}

function deriveStarted(
  raw: Record<string, unknown>,
  hasScoring: boolean
): boolean {
  if (raw.matchStarted === true) return true;
  if (deriveEnded(raw)) return true;
  const statusLower = str(raw.status).toLowerCase();
  if (
    statusLower.includes("scheduled") ||
    statusLower.includes("yet to start") ||
    statusLower.includes("starts ")
  ) {
    return false;
  }
  if (
    statusLower.includes("live") ||
    statusLower.includes("in progress") ||
    statusLower.includes("opt to") ||
    statusLower.includes("toss")
  ) {
    return true;
  }
  return hasScoring;
}

function deriveLive(raw: Record<string, unknown>): boolean {
  if (raw.matchStarted === true && raw.matchEnded !== true) return true;

  const ended = deriveEnded(raw);
  if (ended) return false;

  const status = str(raw.status).toLowerCase();
  const liveSignals = [
    "need",
    "needs",
    "trail",
    "trails",
    "lead",
    "leads",
    "batting",
    "bowling",
    "in progress",
    "live",
    "balls remaining",
    "runs remaining",
    "day ",
    "session",
    "over ",
    "innings",
  ];
  if (liveSignals.some((s) => status.includes(s))) return true;

  const resultSignals = ["won", "lost", "draw", "tied", "abandoned", "no result", "cancelled"];
  const hasResult = resultSignals.some((s) => status.includes(s));
  const dateTimeGMT = str(raw.dateTimeGMT ?? raw.date ?? raw.startDate);
  if (!hasResult && dateTimeGMT) {
    const matchDate = Date.parse(dateTimeGMT);
    if (Number.isFinite(matchDate)) {
      const diffHours = (Date.now() - matchDate) / 3_600_000;
      if (diffHours > 0 && diffHours < 10) return true;
    }
  }

  if (raw.matchStarted === true && !ended) return true;
  return (
    status.includes("live") ||
    status.includes("in progress") ||
    status.includes("opt to")
  );
}

function deriveMatchType(raw: Record<string, unknown>): string {
  const series = asRecord(raw.series);
  const rawType =
    str(raw.matchType) ||
    str(raw.type) ||
    str(series?.matchType) ||
    "";
  if (!rawType || rawType.toLowerCase() === "cricket") {
    return deriveLeague(raw);
  }
  return rawType;
}

function deriveStartTimeIso(raw: Record<string, unknown>): string | null {
  const v =
    str(raw.dateTimeGMT) ||
    str(raw.dateTimeGmt) ||
    str(raw.date) ||
    str(raw.time);
  if (!v) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return v;
  return new Date(t).toISOString();
}

function fallbackId(raw: Record<string, unknown>): string {
  const [a, b] = extractTeams(raw);
  const stamp = str(raw.dateTimeGMT ?? raw.date ?? raw.time ?? "");
  const base = `${a}-${b}-${stamp}`.replace(/\s+/g, "-").toLowerCase();
  const cleaned = base.replace(/[^a-z0-9.-]/g, "");
  return cleaned ? `id-${cleaned.slice(0, 96)}` : "id-unknown-match";
}

function mapBatter(row: unknown): BattingRow | null {
  const o = asRecord(row);
  if (!o) return null;
  const nested = asRecord(o.batsman ?? o.batter ?? o.player);
  const name =
    str(nested?.name ?? nested?.fullName) ||
    str(o.batsman ?? o.name ?? o.player ?? o.shortName);
  if (!name) return null;

  return {
    batter: name,
    runs: num(o.runs ?? o.r),
    balls: num(o.balls ?? o.b),
    fours: num(o.fours ?? o["4s"] ?? o.four),
    sixes: num(o.sixes ?? o["6s"] ?? o.six),
    sr: num(o.sr ?? o.strikeRate ?? o.strikerate),
  };
}

function mapBowler(row: unknown): BowlingRow | null {
  const o = asRecord(row);
  if (!o) return null;
  const nested = asRecord(o.bowler ?? o.player);
  const name =
    str(nested?.name ?? nested?.fullName) ||
    str(o.bowler ?? o.name ?? o.player);
  if (!name) return null;

  return {
    bowler: name,
    overs: str(o.overs ?? o.o, "0"),
    runs: num(o.runs ?? o.r),
    wickets: num(o.wickets ?? o.w),
    economy: num(o.economy ?? o.econ ?? o.ECON),
  };
}

function mapCommentaryRow(row: unknown): CommentaryItem | null {
  const o = asRecord(row);
  if (!o) return null;
  const over = str(o.over ?? o.ball ?? o.ov ?? o.o ?? "");
  const text = str(o.text ?? o.commentary ?? o.comm ?? o.description);
  if (!text) return null;
  return { over: over || "—", text };
}

function extractBatting(raw: Record<string, unknown>): BattingRow[] {
  const direct = [raw.batters, raw.batting, raw.batsmen];
  for (const d of direct) {
    if (Array.isArray(d) && d.length) {
      return d.map(mapBatter).filter((x): x is BattingRow => x !== null);
    }
  }

  const sc = raw.scoreCard ?? raw.scorecard;
  if (Array.isArray(sc)) {
    const first = asRecord(sc[0]);
    const inner = first?.batting ?? first?.batsmen ?? first?.batters;
    if (Array.isArray(inner)) {
      return inner.map(mapBatter).filter((x): x is BattingRow => x !== null);
    }
  }

  const innings = raw.innings;
  if (Array.isArray(innings)) {
    const first = asRecord(innings[0]);
    const inner = first?.batting ?? first?.batsmen;
    if (Array.isArray(inner)) {
      return inner.map(mapBatter).filter((x): x is BattingRow => x !== null);
    }
  }

  return [];
}

function extractBowling(raw: Record<string, unknown>): BowlingRow[] {
  const direct = [raw.bowlers, raw.bowling];
  for (const d of direct) {
    if (Array.isArray(d) && d.length) {
      return d.map(mapBowler).filter((x): x is BowlingRow => x !== null);
    }
  }

  const sc = raw.scoreCard ?? raw.scorecard;
  if (Array.isArray(sc)) {
    const first = asRecord(sc[0]);
    const inner = first?.bowling ?? first?.bowlers;
    if (Array.isArray(inner)) {
      return inner.map(mapBowler).filter((x): x is BowlingRow => x !== null);
    }
  }

  const innings = raw.innings;
  if (Array.isArray(innings)) {
    const first = asRecord(innings[0]);
    const inner = first?.bowling ?? first?.bowlers;
    if (Array.isArray(inner)) {
      return inner.map(mapBowler).filter((x): x is BowlingRow => x !== null);
    }
  }

  return [];
}

function extractCommentary(raw: Record<string, unknown>): CommentaryItem[] {
  const c = raw.commentary ?? raw.commentaries ?? raw.comments;
  if (!Array.isArray(c) || !c.length) return [];
  return c.map(mapCommentaryRow).filter((x): x is CommentaryItem => x !== null);
}

export function unwrapData(payload: unknown): unknown {
  const root = asRecord(payload);
  if (!root) return payload;
  if ("data" in root && root.data !== undefined) return root.data;
  return payload;
}

/** Raw list length before toMatch (for aggregation debug logs). */
export function countRawCurrentMatchesPayload(payload: unknown): number {
  const data = unwrapData(payload);
  return Array.isArray(data) ? data.length : 0;
}

function toMatch(raw: Record<string, unknown>): Match {
  const [team1, team2] = extractTeams(raw);
  const { score1, score2, overs } = extractScores(raw);
  const status =
    str(raw.status) || str(raw.matchStatus) || str(raw.state) || "Status unavailable";

  const hasScoring =
    (score1 !== "—" && score1 !== "") || (score2 !== "—" && score2 !== "");
  const matchEnded = deriveEnded(raw);
  const matchStarted = deriveStarted(raw, hasScoring);
  const isLive = deriveLive(raw);

  const batting = extractBatting(raw);
  const bowling = extractBowling(raw);
  const commentary = extractCommentary(raw);

  return {
    id: str(raw.id ?? raw.unique_id ?? raw.uniqueId) || fallbackId(raw),
    provider: "cricketdata",
    league: deriveLeague(raw),
    team1,
    team2,
    score1,
    score2,
    overs,
    status,
    isLive,
    matchStarted,
    matchEnded,
    matchType: deriveMatchType(raw),
    startTimeIso: deriveStartTimeIso(raw),
    batting,
    bowling,
    commentary,
  };
}

export function transformCurrentMatchesPayload(payload: unknown): Match[] {
  const data = unwrapData(payload);
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      const rec = asRecord(item);
      return rec ? toMatch(rec) : null;
    })
    .filter((x): x is Match => x !== null);
}

export function transformMatchesListPayload(payload: unknown): Match[] {
  const data = unwrapData(payload);
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      const rec = asRecord(item);
      return rec ? toMatch(rec) : null;
    })
    .filter((x): x is Match => x !== null);
}

export function transformMatchInfoPayload(payload: unknown): Match | null {
  const unwrapped = unwrapData(payload);
  const rec = asRecord(unwrapped);
  if (!rec) return null;

  const nested =
    asRecord(rec.match) ??
    asRecord(rec.matchInfo) ??
    asRecord(rec.scoreCard);

  const merged: Record<string, unknown> = nested ? { ...rec, ...nested } : rec;

  const base = toMatch(merged);

  const batting = extractBatting(merged);
  const bowling = extractBowling(merged);
  const commentary = extractCommentary(merged);

  return {
    ...base,
    batting: batting.length ? batting : base.batting,
    bowling: bowling.length ? bowling : base.bowling,
    commentary: commentary.length ? commentary : base.commentary,
  };
}
