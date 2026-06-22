import type { MemoryTTLCache } from "@/lib/cache/memoryCache";
import { dedupeRequest } from "@/lib/cache/requestDeduper";

export type StaleWhileRevalidateOptions = {
  /** Fresh window — served synchronously without refetch */
  ttlMs: number;
  /** After TTL, stale value may still be returned while a refresh runs */
  maxStaleMs: number;
};

/**
 * Return fresh cached value when inside TTL; when stale, return last value
 * immediately and refresh in the background. Misses await the fetcher.
 */
export async function staleWhileRevalidate<T>(
  cache: MemoryTTLCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  opts: StaleWhileRevalidateOptions
): Promise<T> {
  const now = Date.now();
  const row = cache.peekEntry(key);
  if (row && now < row.expiresAt) {
    return row.value;
  }

  if (row && now < row.expiresAt + opts.maxStaleMs) {
    void dedupeRequest(`${key}:swr-bg`, fetcher)
      .then((v) => {
        cache.set(key, v, opts.ttlMs);
      })
      .catch(() => {});
    return row.value;
  }

  return dedupeRequest(`${key}:swr`, async () => {
    const v = await fetcher();
    cache.set(key, v, opts.ttlMs);
    return v;
  });
}
