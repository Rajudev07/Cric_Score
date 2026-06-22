import type { Match } from "@/lib/data/matches";
import { extractCleanTeams, cleanTeamString, splitVsHeadline } from "@/lib/providers/cricbuzz/normalize/extractCleanTeams";
import { isRealLiveIplMatch } from "@/lib/providers/cricbuzz/normalize/isRealLiveIplMatch";
import { rejectStaleCricbuzzMatch } from "@/lib/providers/cricbuzz/normalize/rejectStaleMatches";
import {
  bumpCricbuzzMatchesEmitted,
  logRejectDebug,
} from "@/lib/providers/cricbuzz/normalize/rejectDebug";
import { containsIplSignals } from "@/lib/utils/iplDetection";
import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";

const CRICBUZZ_PROVIDER_ID = "cricbuzz";

const IPL_VALIDATE_TAG = "[cricscore:ipl-validate]";

const NORM_TAG = "[cricscore:normalize]";

function normLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    console.log(NORM_TAG, ...args);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function str(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function teamFrom(obj: unknown): string {
  const o = asRecord(obj);
  if (!o) return "";
  return str(
    o.teamSName ??
      o.teamName ??
      o.name ??
      o.shortName ??
      o.shortname ??
      o.short_name ??
      ""
  );
}

/** Flatten grouped match maps (e.g. { t20: [...], test: [...] }). */
function flattenGroupedMatches(obj: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const v of Object.values(obj)) {
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        out.push(item as Record<string, unknown>);
      }
    }
  }
  return out;
}

function pushCandidateArrays(
  root: Record<string, unknown>,
  into: unknown[],
  depth = 0
): void {
  if (depth > 8) return;
  const candidates = [
    root.matches,
    root.matchList,
    root.liveMatches,
    root.data,
    asRecord(root.response)?.matches,
    asRecord(root.matchList)?.matches,
    asRecord(root.filters)?.matches,
  ];
  for (const c of candidates) {
    if (c !== undefined) into.push(c);
  }
  const matchesVal = root.matches;
  if (
    matchesVal &&
    typeof matchesVal === "object" &&
    !Array.isArray(matchesVal)
  ) {
    into.push(...flattenGroupedMatches(matchesVal as Record<string, unknown>));
  }

  const props = asRecord(root.props);
  const pageProps = props ? asRecord(props.pageProps) : null;
  if (pageProps) {
    pushCandidateArrays(pageProps, into, depth + 1);
    into.push(
      pageProps.matches,
      pageProps.matchList,
      pageProps.liveMatches,
      pageProps.pageData,
      pageProps.initialState,
      pageProps.data
    );
  }
  const appData = asRecord(root.appData);
  if (appData) {
    pushCandidateArrays(appData, into, depth + 1);
  }
  const pagePropsRoot = asRecord(root.pageProps);
  if (pagePropsRoot) {
    pushCandidateArrays(pagePropsRoot, into, depth + 1);
  }
}

const MATCH_KEY_SIGNALS = [
  "matchinfo",
  "matchscore",
  "team1",
  "team2",
  "seriesname",
  "state",
  "status",
  "score",
  "batsman",
  "bowler",
  "matchid",
  "seriesmatches",
  "typematches",
  "matchdetails",
];

function objectKeyMatchesSignal(rec: Record<string, unknown>): boolean {
  const keys = Object.keys(rec).map((k) => k.toLowerCase());
  return keys.some((k) => MATCH_KEY_SIGNALS.some((sig) => k.includes(sig)));
}

function isMatchLikeObject(rec: Record<string, unknown>): boolean {
  if (Object.keys(rec).length < 2) return false;
  if (asRecord(rec.matchInfo) || asRecord(rec.matchScore) || asRecord(rec.match)) {
    return true;
  }
  return objectKeyMatchesSignal(rec);
}

function walkDiscoverMatchLikeObjects(
  payload: unknown,
  maxVisits = 120_000,
  maxHits = 600,
  discoveryLogCap = 40
): { row: Record<string, unknown>; path: string }[] {
  const hits: { row: Record<string, unknown>; path: string }[] = [];
  let visits = 0;
  let discoveryLogged = 0;

  const visit = (node: unknown, path: string): void => {
    if (visits++ > maxVisits || hits.length >= maxHits) return;
    if (node === null || node === undefined) return;
    if (typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        visit(node[i], `${path}[${i}]`);
        if (hits.length >= maxHits || visits > maxVisits) return;
      }
      return;
    }

    const rec = node as Record<string, unknown>;
    if (isMatchLikeObject(rec)) {
      hits.push({ row: rec, path });
      if (discoveryLogged < discoveryLogCap && rowContainsIplContext(rec)) {
        discoveryLogged++;
        const mi = asRecord(rec.matchInfo) ?? asRecord(rec.match) ?? rec;
        normLog("discovered match-like", {
          path: path || "(root)",
          keys: Object.keys(rec).slice(0, 60),
          seriesName: str(mi.seriesName ?? rec.seriesName ?? ""),
          team1: teamFrom(mi.team1 ?? mi.teamHome ?? rec.team1),
          team2: teamFrom(mi.team2 ?? mi.teamAway ?? rec.team2),
          status: str(mi.status ?? mi.state ?? rec.status ?? rec.state ?? ""),
        });
      }
    }

    for (const [k, v] of Object.entries(rec)) {
      visit(v, path ? `${path}.${k}` : k);
      if (hits.length >= maxHits || visits > maxVisits) return;
    }
  };

  visit(payload, "");
  return hits;
}

function splitTeamsFromName(raw: string): [string, string] | null {
  const sp = splitVsHeadline(raw);
  if (sp) return [sp[0], sp[1]];
  const s = raw.replace(/\s+/g, " ").trim();
  const parts = s.split(/\s+vs\.?\s+/i);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return [parts[0].trim(), parts[1].trim()];
  }
  return null;
}

function pickTeamFromValue(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return "";
  return teamFrom(v);
}

function extractTeamsFlexible(mi: Record<string, unknown>, row: Record<string, unknown>): {
  team1: string;
  team2: string;
} {
  const t1 =
    pickTeamFromValue(mi.team1 ?? mi.teamHome ?? mi.homeTeam ?? row.team1 ?? row.t1 ?? row.homeTeam) ||
    str(mi.team1Name ?? mi.team1SName ?? "");
  const t2 =
    pickTeamFromValue(mi.team2 ?? mi.teamAway ?? mi.awayTeam ?? row.team2 ?? row.t2 ?? row.awayTeam) ||
    str(mi.team2Name ?? mi.team2SName ?? "");
  if (t1 && t2) return { team1: t1, team2: t2 };

  const nameCandidates = [
    str(mi.matchDesc ?? ""),
    str(mi.headline ?? ""),
    str(mi.name ?? ""),
    str(mi.matchName ?? ""),
    str(mi.shortName ?? ""),
    str(row.matchDesc ?? ""),
    str(row.headline ?? ""),
    str(row.name ?? ""),
    str(row.title ?? ""),
    str(row.headlineText ?? ""),
    str(row.pageTitle ?? ""),
  ].filter(Boolean);

  for (const n of nameCandidates) {
    const sp = splitTeamsFromName(n);
    if (sp) return { team1: sp[0], team2: sp[1] };
  }

  const mergedProbe = { ...mi, ...row } as Record<string, unknown>;
  const deep = findVsTeamsDeep(mergedProbe);
  if (deep) return { team1: deep[0], team2: deep[1] };

  return { team1: t1, team2: t2 };
}

function rowContainsIplContext(row: Record<string, unknown>): boolean {
  try {
    const blob = JSON.stringify(row).toLowerCase();
    return (
      blob.includes("delhi capitals") ||
      blob.includes("rajasthan royals") ||
      /\bipl\b/.test(blob) ||
      blob.includes("indian premier league") ||
      blob.includes("indian t20 league") ||
      blob.includes("tata ipl")
    );
  } catch {
    return false;
  }
}

/** Trace DC vs RR payloads (full names or common short codes in IPL context). */
function rowContainsDcVsRr(row: Record<string, unknown>): boolean {
  try {
    const b = JSON.stringify(row).toLowerCase();
    if (b.includes("delhi capitals") && b.includes("rajasthan royals")) return true;
    if (b.includes("dc vs rr") || b.includes("rr vs dc")) return true;
    if (
      (/\bipl\b/.test(b) || b.includes("indian premier league")) &&
      /\bdc\b/.test(b) &&
      /\brr\b/.test(b) &&
      (b.includes("delhi") || b.includes("capitals")) &&
      (b.includes("rajasthan") || b.includes("royals"))
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function findVsTeamsDeep(root: Record<string, unknown>): [string, string] | null {
  let visits = 0;
  const MAX = 4000;

  const tryString = (s: string): [string, string] | null => {
    if (s.length > 600) return null;
    const sp = splitVsHeadline(s.trim());
    if (sp && sp[0] && sp[1]) return sp;
    const legacy = splitTeamsFromName(s.trim());
    if (legacy && legacy[0] && legacy[1]) return legacy;
    return null;
  };

  const walk = (node: unknown): [string, string] | null => {
    if (++visits > MAX) return null;
    if (node === null || node === undefined) return null;
    if (typeof node === "string") {
      if (/\bvs\.?\b/i.test(node)) {
        const t = tryString(node);
        if (t) return t;
      }
      return null;
    }
    if (typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const x of node) {
        const t = walk(x);
        if (t) return t;
        if (visits > MAX) return null;
      }
      return null;
    }
    for (const v of Object.values(node as Record<string, unknown>)) {
      const t = walk(v);
      if (t) return t;
      if (visits > MAX) return null;
    }
    return null;
  };

  return walk(root);
}

export function mergeRowsPreferRich(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): Record<string, unknown> {
  const ka = Object.keys(a).length;
  const kb = Object.keys(b).length;
  const base = kb >= ka ? { ...a, ...b } : { ...b, ...a };
  const miA = asRecord(a.matchInfo);
  const miB = asRecord(b.matchInfo);
  if (miB && Object.keys(miB).length >= (miA ? Object.keys(miA).length : 0)) {
    base.matchInfo = miB;
  } else if (miA) {
    base.matchInfo = miA;
  }
  return base;
}

function discoverCricbuzzSourceUrl(row: Record<string, unknown>, mi: Record<string, unknown>): string {
  return str(
    row.matchUrl ?? row.url ?? row.canonicalUrl ?? row.link ?? mi.matchUrl ?? mi.url ?? ""
  );
}

function bestHeadlineForTeams(mi: Record<string, unknown>, row: Record<string, unknown>): string {
  const cands = [
    str(mi.matchDesc ?? ""),
    str(mi.headline ?? ""),
    str(row.headline ?? ""),
    str(row.title ?? ""),
    `${str(mi.seriesName ?? "")} ${str(row.title ?? "")}`.trim(),
  ];
  return cands.find((s) => s.length > 3) ?? "";
}

export type CricbuzzTransformOptions = {
  /** Skip strict team cleaning — URL blacklist only at discovery; permissive teams here. */
  relaxedTeams?: boolean;
  /** Skip row-level stale rejection. */
  relaxedStale?: boolean;
};

export type NormalizeCricbuzzResult =
  | { ok: true; match: Match }
  | { ok: false; reason: string };

export function normalizeCricbuzzMatchCandidate(
  row: Record<string, unknown>,
  discPath: string,
  transformOpts?: CricbuzzTransformOptions
): NormalizeCricbuzzResult {
  const mi = asRecord(row.matchInfo) ?? asRecord(row.match) ?? row;
  const iplCtx = rowContainsIplContext(row);
  const headline = bestHeadlineForTeams(mi, row);
  const raw = extractTeamsFlexible(mi, row);
  const peek = peekScoreboardStrings(mi, row);
  const cleaned = extractCleanTeams(raw.team1, raw.team2, headline, {
    allowScoreboardLoose: true,
    ...peek,
  });
  const sourceUrl = discoverCricbuzzSourceUrl(row, mi);

  if (!cleaned.ok) {
    const alt = extractCleanTeams("", "", headline, {
      allowScoreboardLoose: true,
      ...peek,
    });
    if (alt.ok) {
      return buildMatchFromParts(
        row,
        mi,
        alt.team1,
        alt.team2,
        discPath,
        "headline_only",
        sourceUrl,
        transformOpts
      );
    }
    if (transformOpts?.relaxedTeams) {
      const t1 = (cleanTeamString(raw.team1) || str(mi.team1Name ?? "")).slice(0, 56) || "Team 1";
      const t2 = (cleanTeamString(raw.team2) || str(mi.team2Name ?? "")).slice(0, 56) || "Team 2";
      return buildMatchFromParts(row, mi, t1, t2, discPath, "relaxed_raw", sourceUrl, {
        ...transformOpts,
        relaxedStale: true,
      });
    }
    if (iplCtx) {
      normLog("discard IPL row: invalid team extraction", {
        path: discPath,
        reason: cleaned.reason,
        headline: headline.slice(0, 200),
      });
    }
    logRejectDebug({
      reason: `invalid_teams:${cleaned.reason}`,
      team1: raw.team1,
      team2: raw.team2,
      title: headline.slice(0, 240),
      score1: peek.score1,
      score2: peek.score2,
      overs: peek.overs,
      status: str(mi.status ?? mi.state ?? row.status ?? ""),
      stage: "normalizeInvalidTeams",
    });
    return { ok: false, reason: `invalid_teams:${cleaned.reason} path=${discPath}` };
  }

  return buildMatchFromParts(
    row,
    mi,
    cleaned.team1,
    cleaned.team2,
    discPath,
    "ok",
    sourceUrl,
    transformOpts
  );
}

function buildMatchFromParts(
  row: Record<string, unknown>,
  mi: Record<string, unknown>,
  team1: string,
  team2: string,
  discPath: string,
  _variant: string,
  sourceUrl?: string,
  transformOpts?: CricbuzzTransformOptions
): NormalizeCricbuzzResult {
  const idRaw =
    mi.matchId ?? mi.id ?? row.matchId ?? row.id ?? `${team1}-${team2}`;
  const id = `cbz-${String(idRaw)}`;

  const status =
    str(mi.status ?? mi.matchStatus ?? mi.state ?? row.status ?? row.state ?? "") ||
    "Live";

  const series = str(mi.seriesName ?? mi.series ?? row.seriesName ?? row.series ?? "");
  const league = deriveLeagueLabel(series, status, team1, team2);

  const ms = asRecord(row.matchScore) ?? asRecord(row.score) ?? asRecord(mi.matchScore);
  let score1 = "—";
  let score2 = "—";
  let overs = "—";

  if (ms) {
    const nested = scoreFromMatchScore(ms);
    score1 = nested.score1;
    score2 = nested.score2;
    overs = nested.overs;
  }

  const scoreBlock = asRecord(row.score);
  score1 =
    str(
      mi.team1Score ?? mi.score1 ?? row.score1 ?? scoreBlock?.team1 ?? score1
    ) || score1;
  score2 =
    str(
      mi.team2Score ?? mi.score2 ?? row.score2 ?? scoreBlock?.team2 ?? score2
    ) || score2;
  overs = str(mi.overs ?? row.overs ?? overs) || overs;

  const st = status.toLowerCase();
  const hasScores =
    (score1 !== "—" && score1.length > 0) ||
    (score2 !== "—" && score2.length > 0);

  const matchEnded =
    st.includes("won") ||
    st.includes("abandon") ||
    st.includes("no result") ||
    st.includes("tied");
  const clearlyNotStarted =
    st.includes("scheduled") ||
    st.includes("yet to start") ||
    st.includes("yet to begin") ||
    /\bstarts\s+(on|at)\b/.test(st);
  const matchStarted = (!clearlyNotStarted && !matchEnded) || hasScores;

  const isLive =
    !matchEnded &&
    (st.includes("live") ||
      st.includes("opt to") ||
      st.includes("in progress") ||
      st.includes("strategic timeout") ||
      st.includes("drinks") ||
      st.includes("stumps") ||
      st.includes("innings break") ||
      st.includes("need") ||
      (matchStarted && hasScores));

  const blob = `${team1} ${team2} ${status}`.toLowerCase();
  if (rowContainsIplContext(row) || containsIplSignals(`${league} ${team1} ${team2} ${status}`, { silent: true })) {
    normLog("normalized IPL-ish row", {
      path: discPath,
      id,
      team1,
      team2,
      league,
      status: status.slice(0, 120),
      score1,
      score2,
      overs,
      isLive,
      matchStarted,
    });
  }

  const match: Match = {
      id,
      provider: CRICBUZZ_PROVIDER_ID,
      league,
      team1,
      team2,
      score1,
      score2,
      overs,
      status,
      isLive,
      matchStarted,
      matchEnded,
      matchType: str(mi.matchType ?? mi.type ?? row.matchType ?? row.type ?? "T20"),
      startTimeIso: str(mi.startDate ?? mi.date ?? mi.matchStartTime ?? row.startDate) || null,
      batting: [],
      bowling: [],
      commentary: [],
    };

  const iplHay = containsIplSignals(`${league} ${team1} ${team2} ${status}`, { silent: true });

  if (!transformOpts?.relaxedStale) {
    const stale = rejectStaleCricbuzzMatch(match, { sourceUrl: sourceUrl || undefined });
    if (stale.stale) {
      logRejectDebug({
        reason: `stale:${stale.reason}`,
        url: sourceUrl,
        team1: match.team1,
        team2: match.team2,
        isLive: match.isLive,
        overs: match.overs,
        score1: match.score1,
        score2: match.score2,
        status: match.status,
        stage: "transformStaleReject",
      });
      if (iplHay && (process.env.NODE_ENV === "development" || ingestDebugEnabled())) {
        console.log(IPL_VALIDATE_TAG, {
          id: match.id,
          detectedTeams: [match.team1, match.team2],
          liveSignals: false,
          staleReason: stale.reason,
          accepted: false,
        });
      }
      normLog("stale row rejected", { path: discPath, reason: stale.reason, id: match.id });
      return { ok: false, reason: `stale:${stale.reason}` };
    }
  }

  if (iplHay && (process.env.NODE_ENV === "development" || ingestDebugEnabled())) {
    const scoreLive =
      (match.score1 && match.score1 !== "—") ||
      (match.score2 && match.score2 !== "—") ||
      (match.overs && match.overs !== "—" && /\d/.test(match.overs));
    const statusLive = /\b(need|won|trail|stumps|innings|target|elected|opt to|live|in progress)\b/i.test(
      match.status
    );
    console.log(IPL_VALIDATE_TAG, {
      id: match.id,
      detectedTeams: [match.team1, match.team2],
      liveSignals: scoreLive || statusLive,
      realLiveIpl: isRealLiveIplMatch(match),
      accepted: true,
    });
  }

  return {
    ok: true,
    match,
  };
}

/**
 * Extract raw match rows from any known Cricbuzz / cbzios JSON shape.
 * Exported for aggregator debug counts.
 */
export function extractCricbuzzMatchRows(payload: unknown): Record<string, unknown>[] {
  return extractCricbuzzMatchRowsTagged(payload).map((x) => x.row);
}

export function extractCricbuzzMatchRowsTagged(
  payload: unknown
): { row: Record<string, unknown>; path: string }[] {
  const shallow = collectShallowQueueRows(payload);
  const deep = walkDiscoverMatchLikeObjects(payload);
  const byId = new Map<string, { row: Record<string, unknown>; path: string }>();

  const consider = (row: Record<string, unknown>, path: string) => {
    const k = stableCricbuzzRowId(row);
    const prev = byId.get(k);
    if (!prev) {
      byId.set(k, { row, path });
      return;
    }
    byId.set(k, {
      row: mergeRowsPreferRich(prev.row, row),
      path: `${prev.path}|${path}`,
    });
  };

  for (const r of shallow) consider(r.row, r.path);
  for (const r of deep) consider(r.row, r.path);

  return [...byId.values()];
}

function collectShallowQueueRows(payload: unknown): { row: Record<string, unknown>; path: string }[] {
  const out: { row: Record<string, unknown>; path: string }[] = [];
  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      const x = payload[i];
      if (typeof x === "object" && x !== null && !Array.isArray(x)) {
        out.push({ row: x as Record<string, unknown>, path: `[${i}]` });
      }
    }
    return out;
  }
  const root = asRecord(payload);
  if (!root) return [];

  const collected: Record<string, unknown>[] = [];
  const queue: unknown[] = [];
  pushCandidateArrays(root, queue);

  for (const c of queue) {
    if (Array.isArray(c)) {
      const rows = c.filter(
        (x): x is Record<string, unknown> =>
          typeof x === "object" && x !== null && !Array.isArray(x)
      );
      collected.push(...rows);
    }
  }

  if (collected.length) {
    return collected.map((row, i) => ({ row, path: `queue[${i}]` }));
  }

  if (root.matchInfo && (root.team1 || root.team2 || root.status)) {
    return [{ row: root, path: "root" }];
  }

  return [];
}

function formatInningsScore(inn?: Record<string, unknown>): string {
  if (!inn) return "—";
  const r = inn.runs ?? inn.r ?? inn.score;
  const w = inn.wickets ?? inn.w ?? inn.wkts;
  if (r === undefined && w === undefined) return "—";
  return `${num(r as number, 0)}/${num(w as number, 0)}`;
}

function scoreFromMatchScore(ms: Record<string, unknown>): {
  score1: string;
  score2: string;
  overs: string;
} {
  const t1 = asRecord(ms.team1Score ?? ms.team1);
  const t2 = asRecord(ms.team2Score ?? ms.team2);
  let score1 = "—";
  let score2 = "—";
  let overs = "—";

  if (t1) {
    const inngs1 = asRecord(t1.inngs1) ?? asRecord(t1.innings1) ?? t1;
    score1 = formatInningsScore(inngs1 ?? undefined);
    const o = inngs1?.overs ?? inngs1?.o ?? t1.overs;
    if (o !== undefined) overs = str(o);
  }
  if (t2) {
    const inngs1 = asRecord(t2.inngs1) ?? asRecord(t2.innings1) ?? t2;
    score2 = formatInningsScore(inngs1 ?? undefined);
  }

  return { score1, score2, overs };
}

function peekScoreboardStrings(
  mi: Record<string, unknown>,
  row: Record<string, unknown>
): { score1: string; score2: string; overs: string } {
  const ms = asRecord(row.matchScore) ?? asRecord(row.score) ?? asRecord(mi.matchScore);
  let score1 = "—";
  let score2 = "—";
  let overs = "—";
  if (ms) {
    const nested = scoreFromMatchScore(ms);
    score1 = nested.score1;
    score2 = nested.score2;
    overs = nested.overs;
  }
  const scoreBlock = asRecord(row.score);
  score1 =
    str(mi.team1Score ?? mi.score1 ?? row.score1 ?? scoreBlock?.team1 ?? score1) || score1;
  score2 =
    str(mi.team2Score ?? mi.score2 ?? row.score2 ?? scoreBlock?.team2 ?? score2) || score2;
  overs = str(mi.overs ?? row.overs ?? overs) || overs;
  return { score1, score2, overs };
}

function deriveLeagueLabel(series: string, status: string, team1: string, team2: string): string {
  const hay = `${series} ${status} ${team1} ${team2}`;
  if (containsIplSignals(hay, { silent: true })) {
    const m = hay.match(/\b(?:tata\s+)?ipl\s*20\d{2}\b/i);
    if (m) return m[0].replace(/\s+/g, " ").trim();
    return "IPL";
  }
  return str(series.slice(0, 120)) || "Cricket";
}

export function stableCricbuzzRowId(row: Record<string, unknown>): string {
  const mi = asRecord(row.matchInfo) ?? asRecord(row.match) ?? row;
  const id = mi.matchId ?? mi.id ?? row.matchId ?? row.id;
  if (id !== undefined && id !== null) return String(id);
  const t1 =
    teamFrom(mi.team1 ?? mi.teamHome ?? mi.homeTeam) || str(mi.team1Name ?? "");
  const t2 =
    teamFrom(mi.team2 ?? mi.teamAway ?? mi.awayTeam) || str(mi.team2Name ?? "");
  if (t1 || t2) return `${t1}|${t2}`;
  const keys = Object.keys(mi).sort().join(",");
  return `k:${keys.slice(0, 120)}`;
}

export function transformCricbuzzLivePayload(
  payload: unknown,
  transformOpts?: CricbuzzTransformOptions
): Match[] {
  const tagged = extractCricbuzzMatchRowsTagged(payload);
  const out: Match[] = [];
  let normalized = 0;
  let discarded = 0;

  for (const { row, path } of tagged) {
    const dcRr = rowContainsDcVsRr(row);
    if (dcRr) {
      const mi = asRecord(row.matchInfo) ?? asRecord(row.match) ?? row;
      normLog("DC/RR trace candidate", {
        path,
        keys: Object.keys(row).slice(0, 50),
        seriesName: str(mi.seriesName ?? row.seriesName ?? ""),
        team1: teamFrom(mi.team1 ?? mi.teamHome ?? row.team1),
        team2: teamFrom(mi.team2 ?? mi.teamAway ?? row.team2),
        status: str(mi.status ?? mi.state ?? row.status ?? row.state ?? ""),
      });
    }

    const res = normalizeCricbuzzMatchCandidate(row, path, transformOpts);
    if (res.ok) {
      out.push(res.match);
      normalized++;
    } else {
      discarded++;
      if (dcRr || rowContainsIplContext(row)) {
        normLog("discard DC/RR or IPL row", res.reason, { path, keys: Object.keys(row).slice(0, 40) });
      }
    }
  }

  normLog("summary", {
    rowsDiscovered: tagged.length,
    rowsNormalized: normalized,
    rowsDiscarded: discarded,
  });

  bumpCricbuzzMatchesEmitted(out.length);

  return out;
}
