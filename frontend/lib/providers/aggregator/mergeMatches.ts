import type { Match } from "@/lib/data/matches";

export function mergeProviderMatchLists(lists: Match[][]): Match[] {
  return lists.flat();
}
