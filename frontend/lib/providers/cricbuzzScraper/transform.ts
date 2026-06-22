import type { Match } from "@/lib/data/matches";
import type { CricbuzzTransformOptions } from "@/lib/providers/cricbuzz/transform";
import {
  extractCricbuzzMatchRowsTagged,
  mergeRowsPreferRich,
  stableCricbuzzRowId,
  transformCricbuzzLivePayload,
} from "@/lib/providers/cricbuzz/transform";

export const CRICBUZZ_SCRAPER_PROVIDER_ID = "cricbuzz-scraper";

/**
 * Merge parsed JSON roots and normalize to Match[] with scraper provider id.
 */
export function transformScrapedJsonRoots(
  roots: unknown[],
  opts?: CricbuzzTransformOptions
): Match[] {
  const byId = new Map<string, Record<string, unknown>>();

  for (const root of roots) {
    for (const { row } of extractCricbuzzMatchRowsTagged(root)) {
      const k = stableCricbuzzRowId(row);
      const prev = byId.get(k);
      byId.set(k, prev ? mergeRowsPreferRich(prev, row) : row);
    }
  }

  const wrapped = { matches: [...byId.values()] };
  return transformCricbuzzLivePayload(wrapped, opts).map((m) => ({
    ...m,
    provider: CRICBUZZ_SCRAPER_PROVIDER_ID,
    id: m.id.startsWith("cbz-")
      ? `cbzs-${m.id.slice(4)}`
      : `cbzs-${m.id}`,
  }));
}
