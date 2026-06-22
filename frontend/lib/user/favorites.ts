import {
  loadPreferences,
  mergePreferences,
  savePreferences,
  type UserPreferences,
} from "@/lib/user/preferences";
import { teamCatalog } from "@/lib/data/searchCatalog";

function labelMatchesTeam(label: string, teamId: string): boolean {
  const id = teamId.trim().toLowerCase();
  const l = label.trim().toLowerCase();
  const entity = teamCatalog.find((t) => t.id === id);
  if (!entity) return l.includes(id);
  if (l.includes(entity.shortName.toLowerCase())) return true;
  if (l.includes(entity.name.toLowerCase())) return true;
  return entity.keywords.some((k) => l.includes(k));
}

/** Best-effort map from scorecard label to catalog `id` (e.g. `mi`). */
export function resolveCatalogTeamIdFromLabel(label: string): string | null {
  const l = label.trim().toLowerCase();
  if (!l) return null;
  for (const t of teamCatalog) {
    if (labelMatchesTeam(label, t.id)) return t.id;
  }
  return null;
}

export function getFavoriteTeamIds(): string[] {
  return loadPreferences().favoriteTeamIds;
}

export function isFavoriteTeam(teamId: string): boolean {
  const id = teamId.trim().toLowerCase();
  return loadPreferences().favoriteTeamIds.includes(id);
}

export function setFavoriteTeamIds(ids: string[]): UserPreferences {
  const normalized = [...new Set(ids.map((x) => x.trim().toLowerCase()).filter(Boolean))];
  return mergePreferences({ favoriteTeamIds: normalized });
}

export function toggleFavoriteTeam(teamId: string): UserPreferences {
  const id = teamId.trim().toLowerCase();
  if (!id) return loadPreferences();
  const cur = loadPreferences();
  const set = new Set(cur.favoriteTeamIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const next: UserPreferences = { ...cur, favoriteTeamIds: [...set] };
  savePreferences(next);
  return next;
}

export { subscribePreferences } from "@/lib/user/preferences";
