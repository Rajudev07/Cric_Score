export type CacheMetricKind = "hit" | "miss" | "stale" | "off";

const counts: Record<CacheMetricKind, number> = {
  hit: 0,
  miss: 0,
  stale: 0,
  off: 0,
};

let startedAt = Date.now();

export function resetCacheMetrics(): void {
  counts.hit = 0;
  counts.miss = 0;
  counts.stale = 0;
  counts.off = 0;
  startedAt = Date.now();
}

export function recordCacheEvent(kind: CacheMetricKind): void {
  counts[kind] += 1;
}

export function getCacheMetricsSnapshot(): {
  counts: Record<CacheMetricKind, number>;
  startedAtMs: number;
  total: number;
} {
  const total = counts.hit + counts.miss + counts.stale + counts.off;
  return { counts: { ...counts }, startedAtMs: startedAt, total };
}
