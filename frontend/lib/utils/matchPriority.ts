import type { Match } from "@/lib/data/matches";
import { isRealLiveIplMatch } from "@/lib/providers/cricbuzz/normalize/isRealLiveIplMatch";
import { hasStrongLiveSignals } from "@/lib/providers/cricbuzz/normalize/hasStrongLiveSignals";
import { teamCatalog } from "@/lib/data/searchCatalog";
import { containsIplSignals, explainIplSignals } from "@/lib/utils/iplDetection";
import {
  applyIngestDebugLiveOverride,
  ingestDebugEnabled,
  isDcRrFixture,
  isIngestRowDebugTarget,
} from "@/lib/utils/ingestDebugTrace";

/** Optional client preferences — never required on the server */
export type MatchPriorityContext = {
  favoriteTeamKeys?: ReadonlySet<string>;
  favoriteTournaments?: readonly string[];
};

/** Higher number = show first */
const PRIORITY_REAL_LIVE_IPL = 9000;
const PRIORITY_IPL = 1000;
const PRIORITY_ICC = 920;
const PRIORITY_INDIA_INTL = 880;
const PRIORITY_INTL = 750;
const PRIORITY_MAJOR_LEAGUE = 560;
const PRIORITY_DEFAULT = 220;
const PRIORITY_ASSOCIATE = 80;
const BOOST_FAVORITE_TEAM = 450;
const BOOST_FAVORITE_TOURNAMENT = 220;

const FEATURED_MIN_PRIORITY = PRIORITY_MAJOR_LEAGUE;

const LIVE_PRIO_TAG = "[cricscore:live-priority]";

function livePrioLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    console.log(LIVE_PRIO_TAG, ...args);
  }
}

const ASSOCIATE_MARKERS =
  /\b(romania|bulgaria|estonia|malta|cyprus|serbia|slovenia|croatia|hungary|luxembourg|finland|sweden|norway|denmark|portugal|greece|austria|switzerland|belgium|czech|slovakia|turkey|kuwait|qatar|bahrain|saudi|oman|uae|malaysia|singapore|thailand|philippines|japan|china|vanuatu|samoa|bermuda|cayman|bahamas|worcestershire|sussex)\b/i;

const LOW_VALUE_INDICATORS =
  /\b(bulgaria|serbia|norway|denmark|switzerland|czech|romania|austria|germany|france|jersey|isle of man|guernsey|finland|sweden|estonia|latvia|lithuania|luxembourg|worcestershire|sussex|europe|regional)\b/i;

const HIGH_VALUE_TEAMS = [
  "india",
  "australia",
  "england",
  "pakistan",
  "south africa",
  "new zealand",
  "west indies",
  "sri lanka",
  "bangladesh",
  "zimbabwe",
  "afghanistan",
  "ireland",
  "netherlands",
  "scotland",
] as const;

const MAJOR_LEAGUES =
  /\b(psl|pakistan super league|bbl|big bash|cpl|caribbean premier|sa20|sat20|the hundred|hundred|ilt20|international league t20|global t20|major league cricket|mlc)\b/i;

function haystack(m: Match): string {
  return `${m.league} ${m.team1} ${m.team2} ${m.matchType} ${m.status}`.toLowerCase();
}

function teamLabelMatchesCatalogSide(label: string, teamId: string): boolean {
  const id = teamId.trim().toLowerCase();
  if (!id) return false;
  const l = label.trim().toLowerCase();
  const entity = teamCatalog.find((t) => t.id === id);
  if (!entity) {
    return l.includes(id);
  }
  if (l.includes(entity.shortName.toLowerCase())) return true;
  if (l.includes(entity.name.toLowerCase())) return true;
  return entity.keywords.some((k) => l.includes(k));
}

function matchFavoriteTeamBoost(m: Match, ctx?: MatchPriorityContext): number {
  if (!ctx?.favoriteTeamKeys?.size) return 0;
  for (const tid of ctx.favoriteTeamKeys) {
    if (teamLabelMatchesCatalogSide(m.team1, tid) || teamLabelMatchesCatalogSide(m.team2, tid)) {
      return BOOST_FAVORITE_TEAM;
    }
  }
  return 0;
}

function matchFavoriteTournamentBoost(m: Match, ctx?: MatchPriorityContext): number {
  if (!ctx?.favoriteTournaments?.length) return 0;
  const league = m.league.toLowerCase();
  if (ctx.favoriteTournaments.some((frag) => frag && league.includes(frag))) {
    return BOOST_FAVORITE_TOURNAMENT;
  }
  return 0;
}

function iplRow(m: Match): boolean {
  return containsIplSignals(haystack(m), { silent: true });
}

function isIpl(h: string): boolean {
  return containsIplSignals(h, { silent: true });
}

function isIccEvent(h: string): boolean {
  return (
    /\bicc\b/i.test(h) ||
    /world cup|champions trophy|t20 world|wt\d|world test championship|asia cup|u19 world/i.test(
      h
    )
  );
}

function isIndiaInvolved(h: string): boolean {
  return /\bindia\b|\bind\b/i.test(h);
}

function isIndiaInternational(m: Match): boolean {
  const h = haystack(m);
  if (!isIndiaInvolved(h)) return false;
  const mt = m.matchType.toLowerCase();
  return (
    /t20i|odi|test|international/i.test(mt) ||
    /\bind\b.*\b(women|men)?\b/i.test(h) ||
    /international/i.test(h)
  );
}

export function isInternationalMatch(m: Match): boolean {
  const mt = m.matchType.toLowerCase();
  if (/t20i|odi|test|international/i.test(mt)) return true;
  const h = haystack(m);
  return /\bicc\b|asia cup|world cup/i.test(h);
}

export function isPersonalizedFavoriteMatch(
  m: Match,
  ctx?: MatchPriorityContext
): boolean {
  return matchFavoriteTeamBoost(m, ctx) > 0 || matchFavoriteTournamentBoost(m, ctx) > 0;
}

export function matchPriorityScore(match: Match): number {
  let score = 0;

  if (match.isLive) score += 1000;

  const teamsLower = [
    match.team1?.toLowerCase() ?? "",
    match.team2?.toLowerCase() ?? "",
  ];
  const highValueCount = teamsLower.filter((t) =>
    HIGH_VALUE_TEAMS.some((h) => t.includes(h))
  ).length;
  score += highValueCount * 200;

  const seriesHay = `${match.league} ${match.team1} ${match.team2}`.toLowerCase();
  const isWomens = seriesHay.includes("women");
  if (isWomens && highValueCount >= 1) score += 100;

  const format = (match.matchType ?? "").toLowerCase();
  if (format.includes("test")) score += 150;
  else if (format.includes("odi")) score += 100;
  else if (format.includes("t20i") || format.includes("t20")) score += 80;

  const isLowValue = [
    ...teamsLower,
    match.league.toLowerCase(),
  ].some((s) => LOW_VALUE_INDICATORS.test(s));
  if (isLowValue) score -= 500;

  return score;
}

export function isLowValueMatch(m: Match): boolean {
  const teamsLower = [
    m.team1?.toLowerCase() ?? "",
    m.team2?.toLowerCase() ?? "",
  ];
  return [...teamsLower, m.league.toLowerCase()].some((s) => LOW_VALUE_INDICATORS.test(s));
}

export function hasValidTeamNames(m: Match): boolean {
  const nameA = m.team1?.trim() ?? "";
  const nameB = m.team2?.trim() ?? "";
  const invalid = ["team 1", "team 2", "tba", "tbd", "", "cricket", "unknown", "home", "away"];
  const a = nameA.toLowerCase();
  const b = nameB.toLowerCase();
  return (
    nameA.length > 2 &&
    nameB.length > 2 &&
    !invalid.includes(a) &&
    !invalid.includes(b)
  );
}

export function getMatchPriority(m: Match, ctx?: MatchPriorityContext): number {
  const h = haystack(m);
  let p = PRIORITY_DEFAULT;

  if (isRealLiveIplMatch(m)) p += PRIORITY_REAL_LIVE_IPL;

  if (isIpl(h)) p = Math.max(p, PRIORITY_IPL);
  else if (isIccEvent(h)) p = Math.max(p, PRIORITY_ICC);
  else if (isIndiaInternational(m)) p = Math.max(p, PRIORITY_INDIA_INTL);
  else if (isInternationalMatch(m)) p = Math.max(p, PRIORITY_INTL);
  else if (MAJOR_LEAGUES.test(h)) p = Math.max(p, PRIORITY_MAJOR_LEAGUE);

  if (ASSOCIATE_MARKERS.test(h) && !isIpl(h) && !isIccEvent(h)) {
    p = Math.min(p, PRIORITY_ASSOCIATE);
  }

  p += matchFavoriteTeamBoost(m, ctx);
  p += matchFavoriteTournamentBoost(m, ctx);

  return p;
}

function parseStartMs(m: Match): number {
  if (!m.startTimeIso) return Number.MAX_SAFE_INTEGER;
  const t = Date.parse(m.startTimeIso);
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

export function sortMatchesByPriority(
  matches: Match[],
  ctx?: MatchPriorityContext
): Match[] {
  return [...matches].sort((a, b) => {
    const scoreDiff = matchPriorityScore(b) - matchPriorityScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const pa = getMatchPriority(a, ctx);
    const pb = getMatchPriority(b, ctx);
    if (pa !== pb) return pb - pa;

    const rlA = isRealLiveIplMatch(a) ? 1 : 0;
    const rlB = isRealLiveIplMatch(b) ? 1 : 0;
    if (rlA !== rlB) return rlB - rlA;

    const iplA = iplRow(a) ? 1 : 0;
    const iplB = iplRow(b) ? 1 : 0;
    if (iplA !== iplB) return iplB - iplA;
    if (iplA && iplB) {
      const scrA = a.provider === "cricbuzz-scraper" ? 2 : a.provider === "cricbuzz" ? 1 : 0;
      const scrB = b.provider === "cricbuzz-scraper" ? 2 : b.provider === "cricbuzz" ? 1 : 0;
      if (scrA !== scrB) return scrB - scrA;
    }

    const liveA = a.isLive ? 1 : 0;
    const liveB = b.isLive ? 1 : 0;
    if (liveA !== liveB) return liveB - liveA;

    const intlA = isInternationalMatch(a) ? 1 : 0;
    const intlB = isInternationalMatch(b) ? 1 : 0;
    if (intlA !== intlB) return intlB - intlA;

    const ta = parseStartMs(a);
    const tb = parseStartMs(b);
    if (ta !== tb) return ta - tb;

    return a.team1.localeCompare(b.team1);
  });
}

function normalizeTeamLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function filterDuplicateMatches(matches: Match[]): Match[] {
  const sortedInput = sortMatchesByPriority(matches, undefined);
  const map = new Map<string, Match>();

  for (const m of sortedInput) {
    const t1 = normalizeTeamLabel(m.team1);
    const t2 = normalizeTeamLabel(m.team2);
    const [a, b] = t1 < t2 ? [t1, t2] : [t2, t1];
    const day = m.startTimeIso ? m.startTimeIso.slice(0, 10) : "";
    const leagueKey = iplRow(m) ? "ipl" : normalizeTeamLabel(m.league);
    const key = `${a}|${b}|${day}|${leagueKey}`;

    const existing = map.get(key);
    if (!existing) {
      if (ingestDebugEnabled() && isIngestRowDebugTarget(m)) {
        console.log("[cricscore:filter-dedupe]", {
          action: "keep_first",
          key,
          survivor: { id: m.id, provider: m.provider, priority: getMatchPriority(m) },
        });
      }
      map.set(key, m);
      continue;
    }
    const exIpl = iplRow(existing);
    const mIpl = iplRow(m);
    if (ingestDebugEnabled() && (isIngestRowDebugTarget(m) || isIngestRowDebugTarget(existing))) {
      console.log("[cricscore:filter-dedupe]", {
        action: "collision",
        key,
        existing: {
          id: existing.id,
          provider: existing.provider,
          ipl: exIpl,
          priority: getMatchPriority(existing),
        },
        incoming: {
          id: m.id,
          provider: m.provider,
          ipl: mIpl,
          priority: getMatchPriority(m),
        },
      });
    }
    if (mIpl && !exIpl) {
      if (ingestDebugEnabled() && (isIngestRowDebugTarget(m) || isIngestRowDebugTarget(existing))) {
        console.log("[cricscore:filter-dedupe]", { action: "replace_non_ipl_with_ipl", key, winnerId: m.id });
      }
      map.set(key, m);
      continue;
    }
    if (exIpl && !mIpl) {
      if (ingestDebugEnabled() && (isIngestRowDebugTarget(m) || isIngestRowDebugTarget(existing))) {
        console.log("[cricscore:filter-dedupe]", { action: "drop_non_ipl", key, survivorId: existing.id });
      }
      continue;
    }
    if (mIpl && exIpl) {
      const preferM =
        (m.provider === "cricbuzz-scraper" &&
          existing.provider !== "cricbuzz-scraper") ||
        (m.provider === "cricbuzz-scraper" &&
          existing.provider === "cricbuzz");
      if (ingestDebugEnabled() && (isIngestRowDebugTarget(m) || isIngestRowDebugTarget(existing))) {
        console.log("[cricscore:filter-dedupe]", {
          action: "ipl_pair_prefer_scraper",
          key,
          preferM,
          survivorId: preferM ? m.id : existing.id,
        });
      }
      if (preferM) map.set(key, m);
      continue;
    }
  }

  return [...map.values()];
}

export function isValidDisplayMatch(m: Match): boolean {
  return hasValidTeamNames(m);
}

export function isCompletedStatusText(status: string): boolean {
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

export type MatchPhase = "live" | "upcoming" | "completed";

/** Unofficial feeds often omit flags; infer in-play from status text. */
export function statusSuggestsInPlay(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s.includes("need") ||
    s.includes("won") ||
    s.includes("innings") ||
    s.includes("elected") ||
    s.includes("opt to") ||
    s.includes("toss") ||
    s.includes("trail") ||
    s.includes("lead") ||
    s.includes(" vs ") ||
    /\bvs\.?\b/.test(s)
  );
}

export function getMatchPhase(m: Match): MatchPhase {
  const trace = ingestDebugEnabled() && isDcRrFixture(m);

  if (m.matchEnded || isCompletedStatusText(m.status)) {
    if (trace) {
      console.log("[cricscore:match-phase]", {
        id: m.id,
        branch: "completed_flags",
        status: m.status,
        isLive: m.isLive,
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded,
        phase: "completed" as const,
      });
    }
    return "completed";
  }

  if (hasStrongLiveSignals(m)) {
    if (trace) {
      console.log("[cricscore:match-phase]", {
        id: m.id,
        branch: "strong_live_override",
        phase: "live" as const,
      });
    }
    return "live";
  }

  const st = m.status.toLowerCase();
  const weakLive =
    statusSuggestsInPlay(m.status) || m.isLive || m.matchStarted;

  const h = haystack(m);
  if (containsIplSignals(h, { silent: true })) {
    const clearlyUpcoming =
      !weakLive &&
      (st.includes("yet to start") ||
        st.includes("yet to begin") ||
        st.includes("scheduled") ||
        /\bstarts\s+(on|at)\b/.test(st));
    const phase: MatchPhase = clearlyUpcoming ? "upcoming" : "live";
    if (trace) {
      console.log("[cricscore:match-phase]", {
        id: m.id,
        branch: "ipl_branch",
        status: m.status,
        isLive: m.isLive,
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded,
        weakLive,
        clearlyUpcoming,
        iplHaystack: explainIplSignals(h),
        phase,
      });
    }
    if (clearlyUpcoming) return "upcoming";
    return "live";
  }

  if (weakLive) {
    if (trace) {
      console.log("[cricscore:match-phase]", {
        id: m.id,
        branch: "weak_live_non_ipl",
        status: m.status,
        isLive: m.isLive,
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded,
        iplHaystack: explainIplSignals(h),
        phase: "live" as const,
      });
    }
    return "live";
  }
  if (m.matchStarted && !m.matchEnded) {
    if (trace) {
      console.log("[cricscore:match-phase]", {
        id: m.id,
        branch: "started_not_ended",
        phase: "live" as const,
      });
    }
    return "live";
  }
  if (!m.matchStarted && !m.matchEnded) {
    if (trace) {
      console.log("[cricscore:match-phase]", {
        id: m.id,
        branch: "not_started",
        phase: "upcoming" as const,
      });
    }
    return "upcoming";
  }
  if (trace) {
    console.log("[cricscore:match-phase]", {
      id: m.id,
      branch: "fallback_completed",
      phase: "completed" as const,
    });
  }
  return "completed";
}

export function buildHomeBuckets(
  currentMatches: Match[],
  fixtureMatches: Match[],
  ctx?: MatchPriorityContext
): { live: Match[]; upcoming: Match[]; completed: Match[] } {
  const merged = [...currentMatches, ...fixtureMatches];
  const valid = merged.filter(isValidDisplayMatch);
  const deduped = filterDuplicateMatches(valid);

  const live: Match[] = [];
  const upcoming: Match[] = [];
  const completed: Match[] = [];

  for (const m of deduped) {
    const adjusted = applyIngestDebugLiveOverride(m);
    const phase = getMatchPhase(adjusted);
    if (
      ingestDebugEnabled() &&
      (isIngestRowDebugTarget(adjusted) || isDcRrFixture(adjusted))
    ) {
      console.log("[cricscore:live-bucket]", {
        id: adjusted.id,
        provider: adjusted.provider,
        teams: `${adjusted.team1} vs ${adjusted.team2}`,
        league: adjusted.league,
        phase,
        ipl: explainIplSignals(haystack(adjusted)),
        isLive: adjusted.isLive,
        matchStarted: adjusted.matchStarted,
        matchEnded: adjusted.matchEnded,
        status: adjusted.status.slice(0, 140),
      });
    }
    if (phase === "live") live.push(adjusted);
    else if (phase === "upcoming") upcoming.push(adjusted);
    else completed.push(adjusted);
  }

  const sortedLive = sortMatchesByPriority(live, ctx);
  const fullMemberLive = sortedLive.filter((m) => !isLowValueMatch(m));
  const lowPriorityLive = sortedLive.filter((m) => isLowValueMatch(m));
  const liveToShow =
    fullMemberLive.length > 0 ? fullMemberLive : lowPriorityLive;

  return {
    live: liveToShow,
    upcoming: sortMatchesByPriority(upcoming, ctx),
    completed: sortMatchesByPriority(completed, ctx),
  };
}

export function pickFeaturedMatchId(
  liveMatches: Match[],
  ctx?: MatchPriorityContext
): string | null {
  if (!liveMatches.length) return null;
  const sorted = sortMatchesByPriority(liveMatches, ctx);
  const top = sorted[0];
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    livePrioLog({
      chosenFeaturedMatch: top?.id ?? null,
      teams: top ? `${top.team1} vs ${top.team2}` : null,
      priorityScore: top ? getMatchPriority(top, ctx) : null,
      topThree: sorted.slice(0, 3).map((m) => ({
        id: m.id,
        priority: getMatchPriority(m, ctx),
        teams: `${m.team1} vs ${m.team2}`,
        realLiveIpl: isRealLiveIplMatch(m),
      })),
    });
  }
  if (getMatchPriority(top!, ctx) >= FEATURED_MIN_PRIORITY) {
    return top!.id;
  }
  return null;
}

/** Dev-only: trace counts through display filters vs aggregation. */
export function debugLogHomeIngest(
  currentMatches: Match[],
  fixtureMatches: Match[]
): void {
  if (process.env.NODE_ENV !== "development" && !ingestDebugEnabled()) return;
  const merged = [...currentMatches, ...fixtureMatches];
  const valid = merged.filter(isValidDisplayMatch);
  const deduped = filterDuplicateMatches(valid);
  const buckets = buildHomeBuckets(currentMatches, fixtureMatches);
  const byProvider: Record<string, number> = {};
  for (const m of currentMatches) {
    byProvider[m.provider] = (byProvider[m.provider] ?? 0) + 1;
  }
  const iplAll = merged.filter((m) => containsIplSignals(haystack(m), { silent: true }));
  const iplValid = valid.filter((m) => containsIplSignals(haystack(m), { silent: true }));
  const iplLive = buckets.live.filter((m) => containsIplSignals(haystack(m), { silent: true }));
  console.log("[cricscore:home-ingest]", {
    mergedRows: merged.length,
    validAfterDisplayFilter: valid.length,
    filteredInvalid: merged.length - valid.length,
    duplicateFilterRemoved: valid.length - deduped.length,
    liveBucketCount: buckets.live.length,
    liveTab: buckets.live.length,
    upcomingTab: buckets.upcoming.length,
    completedTab: buckets.completed.length,
    iplDetectedAllRows: iplAll.length,
    transformedIplAfterDisplayFilter: iplValid.length,
    filteredIplLostToInvalid: iplAll.length - iplValid.length,
    iplInLiveTab: iplLive.length,
    providerCountsCurrentFeed: byProvider,
  });
}
