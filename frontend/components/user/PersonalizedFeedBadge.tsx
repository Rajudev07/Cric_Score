"use client";

import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";

export default function PersonalizedFeedBadge() {
  const { prefs, ready } = useUserPreferences();
  if (!ready) return null;
  const n = prefs.favoriteTeamIds.length + prefs.favoriteTournaments.length;
  if (!n) return null;

  return (
    <Badge
      variant="outline"
      className="border-emerald-800/60 bg-emerald-950/35 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/95"
    >
      Personalized
    </Badge>
  );
}
