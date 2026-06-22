import type { Match } from "@/lib/data/matches";
import { canonicalMatchKeys } from "@/lib/providers/federation/canonicalFixtureKey";
import { mergeMatchesForSameFixture } from "@/lib/providers/federation/pickBestProviderRow";
import { scoreMatchRichness } from "@/lib/providers/federation/scoreProviderPayload";
import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";

const MERGE_TAG = "[cricscore:federation-merge]";

function mergeLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === "development" || ingestDebugEnabled()) {
    console.log(MERGE_TAG, ...args);
  }
}

/**
 * Federated merge: group rows across provider lists by canonical fixture keys,
 * then keep / merge the richest combined payload per group.
 */
export function mergeFederatedMatchLists(lists: Match[][]): Match[] {
  const keyToGroup = new Map<string, number>();
  const groups: Match[][] = [];

  for (const list of lists) {
    for (const m of list) {
      const keys = canonicalMatchKeys(m);
      let groupIdx = -1;
      for (const k of keys) {
        const g = keyToGroup.get(k);
        if (g !== undefined) {
          groupIdx = g;
          break;
        }
      }
      if (groupIdx === -1) {
        groupIdx = groups.length;
        groups.push([]);
      }
      groups[groupIdx]!.push(m);
      for (const k of keys) keyToGroup.set(k, groupIdx);
    }
  }

  return groups.map((group) => {
    if (group.length === 1) {
      return mergeMatchesForSameFixture(group);
    }

    const ordered = [...group].sort(
      (a, b) => scoreMatchRichness(b) - scoreMatchRichness(a)
    );
    const winner = ordered[0]!;
    const discarded = ordered.slice(1);

    mergeLog({
      action: "dedupe_merge",
      canonicalKeys: canonicalMatchKeys(winner),
      kept: { id: winner.id, provider: winner.provider, richness: scoreMatchRichness(winner) },
      dropped: discarded.map((d) => ({
        id: d.id,
        provider: d.provider,
        richness: scoreMatchRichness(d),
      })),
    });

    return mergeMatchesForSameFixture(group);
  });
}
