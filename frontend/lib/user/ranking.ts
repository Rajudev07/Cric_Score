import type { Match } from "@/lib/data/matches";
import type { UserPreferences } from "@/lib/user/preferences";
import type { MatchPriorityContext } from "@/lib/utils/matchPriority";
import {
  isPersonalizedFavoriteMatch,
  sortMatchesByPriority,
} from "@/lib/utils/matchPriority";

export { isPersonalizedFavoriteMatch };

export function preferencesToPriorityContext(
  prefs: UserPreferences
): MatchPriorityContext | undefined {
  const keys = prefs.favoriteTeamIds.map((x) => x.trim().toLowerCase()).filter(Boolean);
  const tours = prefs.favoriteTournaments.map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!keys.length && !tours.length) return undefined;
  return {
    favoriteTeamKeys: keys.length ? new Set(keys) : undefined,
    favoriteTournaments: tours.length ? tours : undefined,
  };
}

export function personalizeMatchOrder(
  matches: Match[],
  ctx: MatchPriorityContext | undefined
): Match[] {
  return sortMatchesByPriority(matches, ctx);
}
