import {
  buildRollupFromSamples,
  computeProviderHealthScore,
} from "@/lib/providers/registry/providerHealthScore";
import { getProviderPriorityScores } from "@/lib/providers/federation/ingestSelfHeal";

export type ProviderHealthId = "cricketdata" | "cricbuzz_scraper";

export type ProviderHealthSample = {
  at: number;
  provider: ProviderHealthId;
  ok: boolean;
  latencyMs: number;
  meta?: Record<string, unknown>;
};

const MAX = 200;
const samples: ProviderHealthSample[] = [];

export function recordProviderHealthSample(sample: Omit<ProviderHealthSample, "at">): void {
  samples.push({ ...sample, at: Date.now() });
  while (samples.length > MAX) samples.shift();
}

function summarize(provider: ProviderHealthId, windowMs: number) {
  const since = Date.now() - windowMs;
  const rows = samples.filter((s) => s.provider === provider && s.at >= since);
  if (!rows.length) {
    return {
      provider,
      samples: 0,
      successRate: null as number | null,
      avgLatencyMs: null as number | null,
      emptyPayloadRate: null as number | null,
    };
  }
  const okN = rows.filter((r) => r.ok).length;
  const latencies = rows.map((r) => r.latencyMs).filter((n) => Number.isFinite(n));
  const avgLatencyMs =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const emptyHints = rows.filter((r) => {
    if (r.provider === "cricketdata") {
      return r.meta?.transformedCount === 0;
    }
    return r.meta?.scraperCount === 0;
  });
  return {
    provider,
    samples: rows.length,
    successRate: okN / rows.length,
    avgLatencyMs,
    emptyPayloadRate: emptyHints.length / rows.length,
  };
}

function lastOkAt(provider: ProviderHealthId, windowMs: number): number | null {
  const since = Date.now() - windowMs;
  const ok = samples.filter((s) => s.provider === provider && s.at >= since && s.ok);
  if (!ok.length) return null;
  return Math.max(...ok.map((s) => s.at));
}

function commentarySuccessRate(provider: ProviderHealthId, windowMs: number): number | null {
  const since = Date.now() - windowMs;
  const rows = samples.filter((s) => s.provider === provider && s.at >= since && s.ok);
  const detail = rows.filter((r) => r.meta?.stage === "match_detail");
  if (!detail.length) return null;
  const okComm = detail.filter((r) => Number(r.meta?.commentaryLen ?? 0) > 0);
  return okComm.length / detail.length;
}

function liveContributionAvg(provider: ProviderHealthId, windowMs: number): number | null {
  const since = Date.now() - windowMs;
  const rows = samples.filter((s) => s.provider === provider && s.at >= since && s.ok);
  if (!rows.length) return null;
  const vals = rows
    .map((r) => {
      if (provider === "cricketdata") {
        return Number(r.meta?.liveAfterDedupe ?? r.meta?.transformedCount ?? NaN);
      }
      return Number(r.meta?.liveAfterDedupe ?? r.meta?.scraperCount ?? NaN);
    })
    .filter((n) => Number.isFinite(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function getProviderHealthSnapshot(windowMs = 300_000) {
  const since = Date.now() - windowMs;
  const cricketdata = summarize("cricketdata", windowMs);
  const cricbuzz_scraper = summarize("cricbuzz_scraper", windowMs);
  const cricketRows = samples.filter((s) => s.provider === "cricketdata" && s.at >= since);
  const scraperRows = samples.filter((s) => s.provider === "cricbuzz_scraper" && s.at >= since);

  const cdRoll = buildRollupFromSamples(
    "cricketdata",
    cricketRows.map((s) => ({ ok: s.ok, latencyMs: s.latencyMs, meta: s.meta }))
  );
  const scraperRoll = buildRollupFromSamples(
    "cricbuzz_scraper",
    scraperRows.map((s) => ({ ok: s.ok, latencyMs: s.latencyMs, meta: s.meta }))
  );

  const cdComm = commentarySuccessRate("cricketdata", windowMs);
  const scComm = commentarySuccessRate("cricbuzz_scraper", windowMs);

  return {
    windowMs,
    cricketdata,
    cricbuzz_scraper,
    priorityScores: getProviderPriorityScores(),
    recent: samples.slice(-24),
    federation: {
      cricketdata: {
        ...cdRoll,
        dynamicScore: computeProviderHealthScore("cricketdata", {
          samples: cricketdata.samples,
          successRate: cricketdata.successRate,
          emptyPayloadRate: cricketdata.emptyPayloadRate,
          avgLatencyMs: cricketdata.avgLatencyMs,
          iplDetectionRate: cdRoll.iplDetectionRate,
          parseFailureRate: cdRoll.parseFailureRate,
          liveMatchAvg: cdRoll.liveMatchAvg,
        }),
        healthPct:
          cricketdata.successRate !== null
            ? Math.round(cricketdata.successRate * 1000) / 10
            : null,
        iplSuccessPct:
          cdRoll.iplDetectionRate !== null ? Math.round(cdRoll.iplDetectionRate * 1000) / 10 : null,
        lastOkAt: lastOkAt("cricketdata", windowMs),
        liveContributionAvg: liveContributionAvg("cricketdata", windowMs),
        detailCommentarySuccessPct: cdComm !== null ? Math.round(cdComm * 1000) / 10 : null,
      },
      cricbuzz_scraper: {
        ...scraperRoll,
        dynamicScore: computeProviderHealthScore("cricbuzz_scraper", {
          samples: cricbuzz_scraper.samples,
          successRate: cricbuzz_scraper.successRate,
          emptyPayloadRate: cricbuzz_scraper.emptyPayloadRate,
          avgLatencyMs: cricbuzz_scraper.avgLatencyMs,
          iplDetectionRate: scraperRoll.iplDetectionRate,
          parseFailureRate: scraperRoll.parseFailureRate,
          liveMatchAvg: scraperRoll.liveMatchAvg,
        }),
        healthPct:
          cricbuzz_scraper.successRate !== null
            ? Math.round(cricbuzz_scraper.successRate * 1000) / 10
            : null,
        iplSuccessPct:
          scraperRoll.iplDetectionRate !== null
            ? Math.round(scraperRoll.iplDetectionRate * 1000) / 10
            : null,
        lastOkAt: lastOkAt("cricbuzz_scraper", windowMs),
        liveContributionAvg: liveContributionAvg("cricbuzz_scraper", windowMs),
        detailCommentarySuccessPct: scComm !== null ? Math.round(scComm * 1000) / 10 : null,
      },
    },
  };
}
