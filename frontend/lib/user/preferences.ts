const STORAGE_KEY = "cricscore:prefs:v1";

const PREFS_EVENT = "cricscore:prefs-updated";

export function emitPreferencesUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PREFS_EVENT));
}

export function subscribePreferences(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const wrapped = () => listener();
  window.addEventListener(PREFS_EVENT, wrapped);
  return () => window.removeEventListener(PREFS_EVENT, wrapped);
}

export type UserPreferences = {
  favoriteTeamIds: string[];
  /** Lowercase substrings matched against `Match.league` */
  favoriteTournaments: string[];
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  favoriteTeamIds: [],
  favoriteTournaments: [],
};

function safeParse(raw: string | null): UserPreferences {
  if (!raw) return { ...DEFAULT_USER_PREFERENCES };
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== "object" || v === null) return { ...DEFAULT_USER_PREFERENCES };
    const o = v as Record<string, unknown>;
    const favoriteTeamIds = Array.isArray(o.favoriteTeamIds)
      ? o.favoriteTeamIds.filter((x): x is string => typeof x === "string").map((s) => s.trim().toLowerCase())
      : [];
    const favoriteTournaments = Array.isArray(o.favoriteTournaments)
      ? o.favoriteTournaments.filter((x): x is string => typeof x === "string").map((s) => s.trim().toLowerCase())
      : [];
    return { favoriteTeamIds, favoriteTournaments };
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_USER_PREFERENCES };
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    emitPreferencesUpdated();
  } catch {
    /* quota / private mode */
  }
}

export function mergePreferences(partial: Partial<UserPreferences>): UserPreferences {
  const base = loadPreferences();
  const next: UserPreferences = {
    favoriteTeamIds: partial.favoriteTeamIds ?? base.favoriteTeamIds,
    favoriteTournaments: partial.favoriteTournaments ?? base.favoriteTournaments,
  };
  savePreferences(next);
  return next;
}
