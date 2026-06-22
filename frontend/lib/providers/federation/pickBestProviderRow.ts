import type { BattingRow, BowlingRow, CommentaryItem, Match } from "@/lib/data/matches";
import { getProviderCapability } from "@/lib/providers/registry/providerCapabilities";
import { getEffectiveLiveProviderOrder } from "@/lib/providers/registry/providerPriority";
import { getFederationTrustBias, getScraperPriorityScore } from "@/lib/providers/federation/ingestSelfHeal";
import { isIplFixtureHaystack } from "@/lib/providers/federation/canonicalFixtureKey";
import { isIplProtectionMode } from "@/lib/providers/federation/iplProtection";
import { isRealLiveIplMatch } from "@/lib/providers/cricbuzz/normalize/isRealLiveIplMatch";
import { scoreMatchRichness } from "@/lib/providers/federation/scoreProviderPayload";
import { expandTeamShortCode } from "@/lib/utils/teamNameExpansion";

function isCricbuzzProvider(p: string): boolean {
  return p === "cricbuzz-scraper" || p === "cricbuzz";
}

function isCricbuzzScraper(p: string): boolean {
  return p === "cricbuzz-scraper";
}

function isCricbuzzWrapper(p: string): boolean {
  return p === "cricbuzz";
}

function teamNameRichness(name: string): number {
  const t = name.trim();
  if (!t) return 0;
  if (t.length <= 3 && /^[A-Z]{2,3}$/.test(t)) return 1;
  if (/\s/.test(t) || t.length > 4) return 4;
  return 2;
}

function pickTeamName(a: string, b: string, providerA: string, providerB: string): string {
  const ea = expandTeamShortCode(a);
  const eb = expandTeamShortCode(b);
  const ra = teamNameRichness(ea);
  const rb = teamNameRichness(eb);
  if (ra !== rb) return ra >= rb ? ea : eb;
  const aCb = isCricbuzzProvider(providerA);
  const bCb = isCricbuzzProvider(providerB);
  if (aCb !== bCb) return aCb ? ea : eb;
  return ea.length >= eb.length ? ea : eb;
}

function pickScoreField(
  field: "score1" | "score2" | "overs",
  a: Match,
  b: Match
): string {
  const av = a[field]?.trim() ?? "—";
  const bv = b[field]?.trim() ?? "—";
  const aValid = av && av !== "—";
  const bValid = bv && bv !== "—";
  if (!aValid && !bValid) return "—";
  if (aValid && !bValid) return av;
  if (!aValid && bValid) return bv;
  if (av === bv) return av;

  const at = a.updatedAt ?? 0;
  const bt = b.updatedAt ?? 0;
  if (at !== bt) return at > bt ? av : bv;

  if (isCricbuzzProvider(a.provider) && !isCricbuzzProvider(b.provider)) return av;
  if (isCricbuzzProvider(b.provider) && !isCricbuzzProvider(a.provider)) return bv;
  return av;
}

function candidateScore(m: Match): number {
  const bias = getFederationTrustBias()[m.provider] ?? 1;
  const cap = getProviderCapability(m.provider);
  const trust = cap?.trustScore ?? 0.75;
  const prio = getEffectiveLiveProviderOrder();
  const pr = prio.indexOf(m.provider);
  const prioBoost = pr < 0 ? 0 : (prio.length - pr) * 4;
  const scraperBoost = isCricbuzzScraper(m.provider) ? getScraperPriorityScore() * 8 : 0;

  let s = scoreMatchRichness(m) * bias * (0.75 + trust * 0.25);
  s += prioBoost + scraperBoost;

  if (isRealLiveIplMatch(m)) s += 1200;
  if (isCricbuzzScraper(m.provider) && isIplFixtureHaystack(m)) s += 55;
  if (isCricbuzzWrapper(m.provider) && isIplFixtureHaystack(m)) s += 40;
  if (isIplFixtureHaystack(m)) s += 18;
  if (isCricbuzzScraper(m.provider)) s += 12;
  if (isCricbuzzWrapper(m.provider)) s += 6;
  if (isIplProtectionMode(m)) s += 22;

  return s;
}

function preferStableId(a: Match, b: Match, winner: Match): string {
  if ((isCricbuzzScraper(winner.provider) || isCricbuzzWrapper(winner.provider)) && isIplFixtureHaystack(winner)) {
    return winner.id;
  }
  if (a.id.startsWith("cbz-") && !b.id.startsWith("cbz-")) {
    return b.id;
  }
  if (!a.id.startsWith("cbz-") && b.id.startsWith("cbz-")) {
    return a.id;
  }
  return candidateScore(a) >= candidateScore(b) ? a.id : b.id;
}

function commentaryKey(c: CommentaryItem): string {
  return `${c.over}|${c.text.slice(0, 180)}`;
}

function mergeCommentaryLists(a: CommentaryItem[], b: CommentaryItem[]): CommentaryItem[] {
  const seen = new Set<string>();
  const out: CommentaryItem[] = [];
  const push = (c: CommentaryItem) => {
    const k = commentaryKey(c);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(c);
  };
  const primary = a.length >= b.length ? a : b;
  const secondary = primary === a ? b : a;
  for (const c of primary) push(c);
  for (const c of secondary) push(c);
  const ballRank = (c: CommentaryItem) => {
    const m = c.over.trim().match(/^(\d+)\.(\d+)/) ?? c.text.trim().match(/^(\d+)\.(\d+)/);
    if (!m) return 1_000_000;
    return parseInt(m[1], 10) * 200 + parseInt(m[2], 10);
  };
  return out.sort((x, y) => ballRank(x) - ballRank(y)).slice(-650);
}

function mergeBattingRich(a: BattingRow[], b: BattingRow[], aggressive: boolean): BattingRow[] {
  if (!aggressive) {
    return a.length >= b.length ? a : b;
  }
  const map = new Map<string, BattingRow>();
  for (const row of [...a, ...b]) {
    const k = row.batter.toLowerCase();
    const prev = map.get(k);
    if (!prev || row.balls + row.runs >= prev.balls + prev.runs) {
      map.set(k, row);
    }
  }
  return [...map.values()];
}

function mergeBowlingRich(a: BowlingRow[], b: BowlingRow[], aggressive: boolean): BowlingRow[] {
  if (!aggressive) {
    return a.length >= b.length ? a : b;
  }
  const map = new Map<string, BowlingRow>();
  for (const row of [...a, ...b]) {
    const k = row.bowler.toLowerCase();
    const prev = map.get(k);
    if (!prev || row.wickets > prev.wickets || parseFloat(row.overs) > parseFloat(prev.overs)) {
      map.set(k, row);
    }
  }
  return [...map.values()];
}

export function pickRicherMatch(a: Match, b: Match): Match {
  return candidateScore(a) >= candidateScore(b) ? a : b;
}

function mergePairFederated(a: Match, b: Match): Match {
  const winner = pickRicherMatch(a, b);
  const loser = winner === a ? b : a;
  const id = preferStableId(a, b, winner);
  const iplAgg = isIplProtectionMode(winner) || isIplProtectionMode(loser);

  const score1 = pickScoreField("score1", a, b);
  const score2 = pickScoreField("score2", a, b);
  const overs = pickScoreField("overs", a, b);
  const status =
    winner.status.length >= loser.status.length ? winner.status : loser.status;

  const team1 = pickTeamName(winner.team1, loser.team1, winner.provider, loser.provider);
  const team2 = pickTeamName(winner.team2, loser.team2, winner.provider, loser.provider);

  const batting = mergeBattingRich(winner.batting, loser.batting, iplAgg);
  const bowling = mergeBowlingRich(winner.bowling, loser.bowling, iplAgg);
  const commentary = mergeCommentaryLists(winner.commentary, loser.commentary);

  const league =
    isIplFixtureHaystack(loser) && !isIplFixtureHaystack(winner)
      ? loser.league
      : winner.league || loser.league;

  return {
    ...winner,
    id,
    provider: winner.provider,
    league,
    team1,
    team2,
    score1,
    score2,
    overs,
    status,
    isLive: winner.isLive || loser.isLive,
    matchStarted: winner.matchStarted || loser.matchStarted,
    matchEnded: winner.matchEnded || loser.matchEnded,
    batting,
    bowling,
    commentary,
  };
}

function annotateFederation(result: Match, sources: Match[]): Match {
  const providerSources = [...new Set(sources.map((s) => s.provider))];
  const primary = sources.reduce((best, cur) =>
    candidateScore(cur) > candidateScore(best) ? cur : best
  );
  const richnessScore = scoreMatchRichness(result);
  const diversity = Math.min(35, providerSources.length * 12);
  const signal = Math.min(40, Math.round(richnessScore));
  const confidenceScore = Math.min(100, Math.round(28 + diversity + signal * 0.35));

  return {
    ...result,
    providerSources,
    primaryProvider: primary.provider,
    richnessScore,
    confidenceScore,
  };
}

/**
 * Merge all provider rows for the same canonical fixture into one enriched Match.
 */
export function mergeMatchesForSameFixture(candidates: Match[]): Match {
  if (candidates.length === 0) {
    throw new Error("mergeMatchesForSameFixture: empty group");
  }
  if (candidates.length === 1) {
    return annotateFederation({ ...candidates[0]! }, candidates);
  }

  const ordered = [...candidates].sort((x, y) => candidateScore(y) - candidateScore(x));
  let acc = ordered[0]!;
  for (let i = 1; i < ordered.length; i++) {
    acc = mergePairFederated(acc, ordered[i]!);
  }
  return annotateFederation(acc, candidates);
}
