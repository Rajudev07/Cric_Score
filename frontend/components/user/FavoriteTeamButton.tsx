"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dispatchAnalytics } from "@/lib/analytics/track";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";

export default function FavoriteTeamButton({
  teamId,
  label,
}: {
  teamId: string | null;
  label?: string;
}) {
  const { prefs, ready, toggleTeamFavorite } = useUserPreferences();
  if (!teamId || !ready) return null;

  const active = prefs.favoriteTeamIds.includes(teamId);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={active}
      title={active ? "Remove from favorites" : "Favorite this team"}
      className={cn(
        "gap-1.5 border-zinc-700 bg-zinc-950/60 text-xs font-semibold text-zinc-200 hover:bg-zinc-900",
        active && "border-emerald-700/60 bg-emerald-950/40 text-emerald-100"
      )}
      onClick={() => {
        const nextActive = !active;
        toggleTeamFavorite(teamId);
        dispatchAnalytics({
          kind: "favorite_toggle",
          teamId,
          action: nextActive ? "add" : "remove",
        });
      }}
    >
      <Star
        className={cn("size-3.5", active ? "fill-emerald-400 text-emerald-300" : "text-zinc-500")}
      />
      {label ?? (active ? "Following" : "Follow")}
    </Button>
  );
}
