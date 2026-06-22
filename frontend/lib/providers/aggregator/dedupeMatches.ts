import type { Match } from "@/lib/data/matches";
import { mergeFederatedMatchLists } from "@/lib/providers/federation/mergeFederatedMatches";

export { canonicalMatchKey, isIplFixtureHaystack } from "@/lib/providers/federation/canonicalFixtureKey";

/** Single-list dedupe is federation with one provider bucket. */
export function dedupeMatches(matches: Match[]): Match[] {
  return mergeFederatedMatchLists([matches]);
}
