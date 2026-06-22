import { Redis } from "@upstash/redis";
import type { AggregatedResult } from "@/lib/providers/aggregator";
import { recordCacheEvent } from "@/lib/ops/cacheMetrics";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

type Envelope<T> = { saved: number; payload: AggregatedResult<T> };

export async function cachedAggregatedFetch<T>(options: {
  cacheKey: string;
  /** Fresh window: serve from Redis without hitting origin. */
  ttlMs: number;
  /** When origin fails, serve Redis copy if younger than this. */
  staleServeMs: number;
  /** Redis key TTL (seconds). */
  exSeconds: number;
  fetcher: () => Promise<AggregatedResult<T>>;
}): Promise<{ result: AggregatedResult<T>; cache: "hit" | "miss" | "stale" | "off" }> {
  const r = getRedis();
  if (!r) {
    recordCacheEvent("off");
    const result = await options.fetcher();
    return { result, cache: "off" };
  }

  const now = Date.now();
  let envelope: Envelope<T> | null = null;
  try {
    const raw = await r.get<string>(options.cacheKey);
    if (typeof raw === "string" && raw.length) {
      envelope = JSON.parse(raw) as Envelope<T>;
    }
  } catch {
    envelope = null;
  }

  if (envelope && now - envelope.saved < options.ttlMs) {
    recordCacheEvent("hit");
    return { result: envelope.payload, cache: "hit" };
  }

  const fresh = await options.fetcher();

  if (fresh.ok) {
    try {
      const next: Envelope<T> = { saved: now, payload: fresh };
      await r.set(options.cacheKey, JSON.stringify(next), { ex: options.exSeconds });
    } catch {
      /* non-fatal */
    }
  }

  if (!fresh.ok && envelope && now - envelope.saved < options.staleServeMs) {
    recordCacheEvent("stale");
    return { result: envelope.payload, cache: "stale" };
  }

  recordCacheEvent("miss");
  return { result: fresh, cache: "miss" };
}
