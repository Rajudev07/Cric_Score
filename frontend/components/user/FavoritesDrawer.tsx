"use client";

import Link from "next/link";
import { teamCatalog } from "@/lib/data/searchCatalog";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";

interface FavoritesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FavoritesDrawer({ open, onOpenChange }: FavoritesDrawerProps) {
  const { prefs, toggleTeamFavorite } = useUserPreferences();

  if (!open) return null;

  const favorites = teamCatalog.filter((t) => prefs.favoriteTeamIds.includes(t.id));

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Close favorites"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <aside className="relative z-[61] flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl shadow-black">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100">Favorite teams</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {favorites.length === 0 ? (
            <p className="text-sm leading-relaxed text-zinc-500">
              Follow teams from a team hub or match page. They will float to the top of your live
              feed when matched.
            </p>
          ) : (
            favorites.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/team/${encodeURIComponent(t.id)}`}
                    className="font-semibold text-zinc-100 hover:text-white"
                    onClick={() => onOpenChange(false)}
                  >
                    {t.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{t.shortName}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => toggleTeamFavorite(t.id)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
