import { getProviderCapability } from "@/lib/providers/registry/providerCapabilities";
import { getFederationTrustBias } from "@/lib/providers/federation/ingestSelfHeal";

export type ProviderHealthIdRollup = "cricketdata" | "cricbuzz_scraper";

export type ProviderHealthRollup = {
  provider: string;
  successRate: number | null;
  emptyPayloadRate: number | null;
  iplDetectionRate: number | null;
  avgLatencyMs: number | null;
  liveMatchAvg: number | null;
  parseFailureRate: number | null;
  dynamicScore: number;
};

function safeRate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return num / den;
}

/**
 * Combine rolling samples + declared trust for federation weighting.
 */
export function computeProviderHealthScore(
  provider: ProviderHealthIdRollup | string,
  rollup: {
    samples: number;
    successRate: number | null;
    emptyPayloadRate: number | null;
    avgLatencyMs: number | null;
    iplDetectionRate?: number | null;
    parseFailureRate?: number | null;
    liveMatchAvg?: number | null;
  }
): number {
  const cap = getProviderCapability(provider);
  const baseTrust = cap?.trustScore ?? 0.7;
  const bias = getFederationTrustBias()[provider] ?? 1;

  let score = 50 + baseTrust * 40 * bias;

  if (rollup.successRate !== null) {
    score += rollup.successRate * 25;
  }
  if (rollup.emptyPayloadRate !== null) {
    score -= rollup.emptyPayloadRate * 35;
  }
  if (rollup.avgLatencyMs !== null && rollup.avgLatencyMs > 0) {
    score -= Math.min(18, rollup.avgLatencyMs / 400);
  }
  if (rollup.iplDetectionRate != null) {
    score += rollup.iplDetectionRate * 12;
  }
  if (rollup.parseFailureRate != null) {
    score -= rollup.parseFailureRate * 20;
  }
  if (rollup.liveMatchAvg != null) {
    score += Math.min(12, rollup.liveMatchAvg / 3);
  }

  return Math.max(5, Math.min(120, Math.round(score * 10) / 10));
}

export function buildRollupFromSamples(
  provider: ProviderHealthIdRollup,
  rows: { ok: boolean; latencyMs: number; meta?: Record<string, unknown> }[]
): Omit<ProviderHealthRollup, "dynamicScore" | "provider"> {
  if (!rows.length) {
    return {
      successRate: null,
      emptyPayloadRate: null,
      iplDetectionRate: null,
      avgLatencyMs: null,
      liveMatchAvg: null,
      parseFailureRate: null,
    };
  }
  const okN = rows.filter((r) => r.ok).length;
  const emptyHints = rows.filter((r) => {
    if (provider === "cricketdata") {
      return r.meta?.transformedCount === 0;
    }
    return r.meta?.scraperCount === 0;
  });
  const iplHints = rows.filter((r) => {
    const n = Number(r.meta?.iplCount ?? r.meta?.iplAfterDedupe ?? 0);
    return Number.isFinite(n) && n > 0;
  });
  const parseFails = rows.filter((r) => r.meta?.parseFailure === true || r.meta?.stage === "parse_fail");
  const latencies = rows.map((r) => r.latencyMs).filter((n) => Number.isFinite(n));
  const avgLatencyMs =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;

  const liveAvgs = rows
    .map((r) => {
      const v = r.meta?.liveAfterDedupe ?? r.meta?.transformedCount ?? r.meta?.scraperCount;
      return typeof v === "number" ? v : null;
    })
    .filter((x): x is number => x !== null);

  const liveMatchAvg =
    liveAvgs.length > 0 ? liveAvgs.reduce((a, b) => a + b, 0) / liveAvgs.length : null;

  return {
    successRate: safeRate(okN, rows.length),
    emptyPayloadRate: safeRate(emptyHints.length, rows.length),
    iplDetectionRate: safeRate(iplHints.length, rows.length),
    avgLatencyMs,
    liveMatchAvg,
    parseFailureRate: safeRate(parseFails.length, rows.length),
  };
}
