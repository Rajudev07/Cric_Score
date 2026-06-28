import { fetchAllCricketDataCurrentMatches, type CricketDataResult } from "@/lib/providers/cricketData/client";
import {
  DAILY_CALL_LIMIT,
  getAdaptiveTTL,
  getCricketDataCacheTtlMs,
  getCricketDataCallsToday,
  getCricketDataQuotaStatus,
  incrementCricketDataCallCount,
  isCricketDataQuotaExhausted,
  markCricketDataFetch,
  recordCricketDataApiInfo,
  setCricketDataCacheTtlMs,
  shouldForceCacheBust,
} from "@/lib/providers/cricketData/quotaState";
import { MemoryTTLCache } from "@/lib/cache/memoryCache";

const cricketDataCache = new MemoryTTLCache<unknown[]>();

function extractApiInfo(payload: unknown): void {
  if (typeof payload !== "object" || payload === null) return;
  const root = payload as Record<string, unknown>;
  if (root.info) recordCricketDataApiInfo(root.info);
}

function unwrapRows(payload: unknown): unknown[] {
  if (typeof payload !== "object" || payload === null) return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null && Array.isArray((data as Record<string, unknown>).data)) {
    return (data as Record<string, unknown>).data as unknown[];
  }
  return [];
}

async function fetchAllCricketDataMatchesRaw(): Promise<unknown[]> {
  const res = await fetchAllCricketDataCurrentMatches("static");
  incrementCricketDataCallCount();
  markCricketDataFetch();

  if (res.ok) {
    extractApiInfo(res.data);
    const rows = unwrapRows(res.data);
    console.log("[cricapi] fresh fetch, matches:", rows.length);
    return rows;
  }

  console.warn("[cricapi] fetch failed:", res.error);
  return [];
}

export async function fetchCricketDataWithCache(): Promise<unknown[]> {
  const callsToday = getCricketDataCallsToday();
  const ttl = getAdaptiveTTL(callsToday);
  setCricketDataCacheTtlMs(ttl);

  console.log(`[cricapi] calls today: ${callsToday}/${DAILY_CALL_LIMIT}`);

  const cacheKey = "currentMatches:v1";
  const cached = cricketDataCache.get(cacheKey);
  const entry = cricketDataCache.peekEntry(cacheKey);

  if (cached && entry && !shouldForceCacheBust()) {
    const ageSec = Math.round((Date.now() - (entry.expiresAt - ttl)) / 1000);
    console.log("[cricapi] serving from cache, age:", ageSec + "s");
    return cached;
  }

  if (isCricketDataQuotaExhausted() && cached?.length) {
    console.log("[cricapi] quota exhausted — serving stale cache");
    return cached;
  }

  const fresh = await fetchAllCricketDataMatchesRaw();
  if (fresh.length) {
    cricketDataCache.set(cacheKey, fresh, ttl);
    return fresh;
  }

  if (cached?.length) {
    console.log("[cricapi] fetch empty/failed — serving stale cache");
    return cached;
  }

  return fresh;
}

export function getCricketDataQuotaSnapshot() {
  const ttlMs = getCricketDataCacheTtlMs();
  return {
    cricketDataCallsToday: getCricketDataCallsToday(),
    cricketDataQuotaStatus: getCricketDataQuotaStatus(),
    cricketDataCacheTTL: Math.round(ttlMs / 1000),
  };
}

export async function fetchCricketDataCurrentMatchesCached(): Promise<CricketDataResult<unknown>> {
  const rows = await fetchCricketDataWithCache();
  return { ok: true, data: { status: "success", data: rows } };
}
