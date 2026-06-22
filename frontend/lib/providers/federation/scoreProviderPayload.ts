import type { Match } from "@/lib/data/matches";
import { containsIplSignals } from "@/lib/utils/iplDetection";
import { computeProviderHealthScore } from "@/lib/providers/registry/providerHealthScore";
import type { ProviderHealthId } from "@/lib/ops/providerHealth";
import { isIplFixtureHaystack } from "@/lib/providers/federation/canonicalFixtureKey";

function commentaryBallHints(commentary: Match["commentary"]): number {
  let n = 0;
  for (const c of commentary) {
    if (/^\d+\.\d+/.test(c.over.trim()) || /^\d+\.\d+/.test(c.text.trim())) n++;
  }
  return n;
}

/**
 * Weighted richness for choosing primary provider / federation winner.
 */
export function scoreMatchRichness(m: Match): number {
  let s = 0;
  if (m.score1 && m.score1 !== "—") s += 8;
  if (m.score2 && m.score2 !== "—") s += 8;
  if (m.overs && m.overs !== "—") s += 6;
  if (m.status && m.status.length > 6) s += 2;
  s += m.batting.length * 5;
  s += m.bowling.length * 5;
  s += Math.min(120, m.commentary.length * 2);
  s += commentaryBallHints(m.commentary) * 4;
  if (m.isLive) s += 10;
  if (m.matchStarted) s += 4;
  if (isIplFixtureHaystack(m)) s += 25;
  if (containsIplSignals(m.league, { silent: true })) s += 6;
  return s;
}

/**
 * Provider-adjusted pick score (static trust + optional health snapshot).
 */
export function scoreProviderAdjustedMatch(
  m: Match,
  health?: { provider: ProviderHealthId; samples: number; successRate: number | null; emptyPayloadRate: number | null; avgLatencyMs: number | null }
): number {
  let s = scoreMatchRichness(m);
  if (health && health.samples > 0) {
    const hs = computeProviderHealthScore(health.provider, {
      samples: health.samples,
      successRate: health.successRate,
      emptyPayloadRate: health.emptyPayloadRate,
      avgLatencyMs: health.avgLatencyMs,
    });
    s += hs * 0.08;
  }
  return s;
}
