/**
 * Legacy Cricbuzz JSON wrapper — disabled (scraper-first). Kept for type/constants only.
 */
export const CRICBUZZ_PROVIDER_ID = "cricbuzz";

export type CricbuzzFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** No network: wrapper endpoints removed (scraper + CricketData only). */
export async function fetchCricbuzzLivePayload(): Promise<
  CricbuzzFetchResult<unknown>
> {
  return { ok: false, error: "Cricbuzz JSON wrapper disabled." };
}
