"use client";

import { useCallback, useEffect, useState } from "react";
import { toggleFavoriteTeam } from "@/lib/user/favorites";
import {
  DEFAULT_USER_PREFERENCES,
  loadPreferences,
  type UserPreferences,
  subscribePreferences,
} from "@/lib/user/preferences";

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
    setReady(true);
    return subscribePreferences(() => {
      setPrefs(loadPreferences());
    });
  }, []);

  const toggleTeamFavorite = useCallback((teamId: string) => {
    toggleFavoriteTeam(teamId);
  }, []);

  return { prefs, ready, toggleTeamFavorite };
}
