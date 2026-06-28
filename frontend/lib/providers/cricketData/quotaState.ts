export const DAILY_CALL_LIMIT = 80;
export const CACHE_BUST_HOURS = [6, 12, 18];

export type QuotaStatus = "ok" | "warning" | "exhausted";

let callsToday = 0;
let hitsLimit = 100;
let lastCacheTtlMs = 60_000;
let lastFetchAt = 0;

export function recordCricketDataApiInfo(info: unknown): void {
  if (typeof info !== "object" || info === null) return;
  const rec = info as Record<string, unknown>;
  if (typeof rec.hitsToday === "number") callsToday = rec.hitsToday;
  if (typeof rec.hitsLimit === "number") hitsLimit = rec.hitsLimit;
}

export function incrementCricketDataCallCount(): void {
  callsToday += 1;
}

export function getCricketDataCallsToday(): number {
  return callsToday;
}

export function getCricketDataCacheTtlMs(): number {
  return lastCacheTtlMs;
}

export function setCricketDataCacheTtlMs(ms: number): void {
  lastCacheTtlMs = ms;
}

export function markCricketDataFetch(): void {
  lastFetchAt = Date.now();
}

export function getCricketDataLastFetchAt(): number {
  return lastFetchAt;
}

export function getAdaptiveTTL(calls: number): number {
  if (calls > 60) return 5 * 60_000;
  if (calls > 40) return 2 * 60_000;
  return 60_000;
}

export function getCricketDataQuotaStatus(): QuotaStatus {
  if (callsToday >= DAILY_CALL_LIMIT || callsToday >= hitsLimit) return "exhausted";
  if (callsToday > 40) return "warning";
  return "ok";
}

export function isCricketDataQuotaExhausted(): boolean {
  return getCricketDataQuotaStatus() === "exhausted";
}

export function shouldForceCacheBust(): boolean {
  const hour = new Date().getUTCHours();
  return CACHE_BUST_HOURS.includes(hour) && Date.now() - lastFetchAt > 30 * 60_000;
}
