"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import type { Match } from "@/lib/data/matches";
import type { CategorizedSearchResults, SearchResultItem } from "@/lib/utils/search";
import { expandTeamShortCode } from "@/lib/utils/teamNameExpansion";
import { cn } from "@/lib/utils";
import SearchResultCard from "./SearchResultCard";

interface SearchResultsProps {
  results: CategorizedSearchResults | undefined;
  activeFlatIndex: number;
  setActiveFlatIndex: (i: number) => void;
  onPick: () => void;
  loading: boolean;
  queryMinLength: boolean;
  error?: Error;
  showEmptyState?: boolean;
  history?: string[];
  liveMatches?: Match[];
  onHistoryPick?: (q: string) => void;
  onClearHistory?: () => void;
  emptyNavOffset?: number;
}

function renderSection(
  title: string,
  items: SearchResultItem[],
  startIndex: number,
  activeFlatIndex: number,
  setActiveFlatIndex: (i: number) => void,
  onPick: () => void
): { node: ReactNode; count: number } {
  if (!items.length) return { node: null, count: 0 };
  let offset = 0;
  const node = (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const flatIndex = startIndex + offset;
          offset += 1;
          return (
            <SearchResultCard
              key={`${item.type}-${item.href}-${flatIndex}`}
              item={item}
              active={activeFlatIndex === flatIndex}
              onMouseEnter={() => setActiveFlatIndex(flatIndex)}
              onNavigate={onPick}
            />
          );
        })}
      </div>
    </div>
  );
  return { node, count: offset };
}

export default function SearchResults({
  results,
  activeFlatIndex,
  setActiveFlatIndex,
  onPick,
  loading,
  queryMinLength,
  error,
  showEmptyState,
  history = [],
  liveMatches = [],
  onHistoryPick,
  onClearHistory,
}: SearchResultsProps) {
  const totalCount = useMemo(() => {
    if (!results) return 0;
    return (
      results.matches.length + results.teams.length + results.players.length
    );
  }, [results]);

  if (error) {
    return (
      <p className="px-3 py-8 text-center text-sm text-red-400/90">
        {error.message}
      </p>
    );
  }

  if (showEmptyState) {
    let idx = 0;
    return (
      <div className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain px-1 py-2">
        {history.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Recent searches
            </p>
            <div className="space-y-1">
              {history.map((q) => {
                const flatIndex = idx++;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onHistoryPick?.(q)}
                    onMouseEnter={() => setActiveFlatIndex(flatIndex)}
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                      activeFlatIndex === flatIndex
                        ? "bg-zinc-800 text-zinc-100"
                        : "hover:bg-zinc-900"
                    )}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
            {onClearHistory ? (
              <button
                type="button"
                onClick={onClearHistory}
                className="mt-2 px-3 text-xs text-zinc-500 underline-offset-2 hover:text-zinc-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              >
                Clear history
              </button>
            ) : null}
          </div>
        ) : null}
        {liveMatches.length > 0 ? (
          <div className="mb-2">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Live now
            </p>
            <div className="space-y-1">
              {liveMatches.map((m) => {
                const flatIndex = idx++;
                const t1 = expandTeamShortCode(m.team1);
                const t2 = expandTeamShortCode(m.team2);
                return (
                  <Link
                    key={m.id}
                    href={`/match/${m.id}`}
                    onClick={onPick}
                    onMouseEnter={() => setActiveFlatIndex(flatIndex)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                      activeFlatIndex === flatIndex
                        ? "bg-zinc-800"
                        : "hover:bg-zinc-900"
                    )}
                  >
                    <p className="text-sm font-semibold text-zinc-200">
                      {t1} vs {t2}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {m.score1 || "—"} · {m.score2 || "—"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
        {!history.length && !liveMatches.length ? (
          <p className="px-3 py-10 text-center text-sm text-zinc-500">
            Type at least 2 characters to search teams, players, and matches.
          </p>
        ) : null}
      </div>
    );
  }

  if (!queryMinLength) {
    return (
      <p className="px-3 py-10 text-center text-sm text-zinc-500">
        Type at least 2 characters to search teams, players, and matches.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 px-3 py-4">
        {[1, 2, 3, 4].map((k) => (
          <div
            key={k}
            className="h-14 animate-pulse rounded-lg bg-zinc-900/80"
          />
        ))}
      </div>
    );
  }

  if (!results || totalCount === 0) {
    return (
      <p className="px-3 py-10 text-center text-sm text-zinc-500">
        No results — try another spelling or short code (e.g. CSK, IND).
      </p>
    );
  }

  let idx = 0;
  const m = renderSection(
    "Matches",
    results.matches,
    idx,
    activeFlatIndex,
    setActiveFlatIndex,
    onPick
  );
  idx += m.count;
  const t = renderSection(
    "Teams",
    results.teams,
    idx,
    activeFlatIndex,
    setActiveFlatIndex,
    onPick
  );
  idx += t.count;
  const p = renderSection(
    "Players",
    results.players,
    idx,
    activeFlatIndex,
    setActiveFlatIndex,
    onPick
  );

  return (
    <div className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain px-1 py-2">
      {m.node}
      {t.node}
      {p.node}
    </div>
  );
}
