"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScoreFlash } from "@/lib/types/live";
import EmptyState from "@/components/home/EmptyState";
import FormatFilter from "@/components/home/FormatFilter";
import FeaturedMatch, { isHighProfileFeaturedMatch } from "@/components/home/FeaturedMatch";
import MatchCard from "@/components/matches/MatchCard";
import MatchNotifyBell from "@/components/notifications/MatchNotifyBell";
import type { Match } from "@/lib/data/matches";
import { lastBallCommentaryLine } from "@/lib/utils/lastBall";
import {
  FORMAT_FILTER_LABELS,
  FORMAT_FILTER_STORAGE_KEY,
  filterMatches,
  isFormatFilterId,
  type FormatFilterId,
} from "@/lib/utils/formatFilter";
import {
  isPersonalizedFavoriteMatch,
  type MatchPriorityContext,
} from "@/lib/utils/matchPriority";
import { expandTeamShortCode } from "@/lib/utils/teamNameExpansion";

type TabId = "live" | "upcoming" | "completed";

const tabs: { id: TabId; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
];

interface HomeMatchTabsProps {
  live: Match[];
  upcoming: Match[];
  completed: Match[];
  scoreFlashById?: Record<string, ScoreFlash>;
  rankingContext?: MatchPriorityContext;
}

export default function HomeMatchTabs({
  live,
  upcoming,
  completed,
  scoreFlashById,
  rankingContext,
}: HomeMatchTabsProps) {
  const [tab, setTab] = useState<TabId>("live");
  const [formatFilter, setFormatFilter] = useState<FormatFilterId>("all");

  useEffect(() => {
    const stored = localStorage.getItem(FORMAT_FILTER_STORAGE_KEY);
    if (stored && isFormatFilterId(stored)) {
      setFormatFilter(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FORMAT_FILTER_STORAGE_KEY, formatFilter);
  }, [formatFilter]);

  const featuredMatch = useMemo(() => {
    const candidate = live.find((m) => isHighProfileFeaturedMatch(m)) ?? null;
    if (!candidate) return null;
    return filterMatches([candidate], formatFilter)[0] ?? null;
  }, [live, formatFilter]);

  const liveWithoutFeatured = useMemo(
    () => (featuredMatch ? live.filter((m) => m.id !== featuredMatch.id) : live),
    [live, featuredMatch]
  );

  const activeList =
    tab === "live"
      ? liveWithoutFeatured
      : tab === "upcoming"
        ? upcoming
        : completed;

  const filteredList = useMemo(
    () => filterMatches(activeList, formatFilter),
    [activeList, formatFilter]
  );

  const formatEmptyMessage =
    formatFilter !== "all" && activeList.length > 0 && filteredList.length === 0
      ? `No ${FORMAT_FILTER_LABELS[formatFilter]} matches right now`
      : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
              tab === t.id
                ? "border border-b-0 border-zinc-700 bg-zinc-900 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
            <span className="ml-2 tabular-nums text-xs font-medium text-zinc-500">
              {t.id === "live"
                ? live.length
                : t.id === "upcoming"
                  ? upcoming.length
                  : completed.length}
            </span>
          </button>
        ))}
      </div>

      <FormatFilter value={formatFilter} onChange={setFormatFilter} />

      {tab === "live" && featuredMatch ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Featured match
          </h2>
          <FeaturedMatch
            match={featuredMatch}
            scoreFlash={scoreFlashById?.[featuredMatch.id]}
          />
        </section>
      ) : null}

      {formatEmptyMessage ? (
        <EmptyState tab={tab} upcoming={upcoming} message={formatEmptyMessage} />
      ) : tab === "live" && filteredList.length === 0 && !featuredMatch ? (
        <EmptyState tab="live" upcoming={upcoming} />
      ) : tab !== "live" && filteredList.length === 0 ? (
        <EmptyState tab={tab} upcoming={upcoming} />
      ) : filteredList.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredList.map((match) => (
            <div key={match.id} className="relative">
              {tab === "upcoming" ? (
                <div className="absolute right-3 top-3 z-10">
                  <MatchNotifyBell
                    matchId={match.id}
                    label={`${expandTeamShortCode(match.team1)} vs ${expandTeamShortCode(match.team2)}`}
                  />
                </div>
              ) : null}
              <MatchCard
                id={match.id}
                league={match.league}
                team1={expandTeamShortCode(match.team1)}
                team2={expandTeamShortCode(match.team2)}
                score1={match.score1}
                score2={match.score2}
                status={match.status}
                overs={match.overs}
                matchType={match.matchType}
                isLive={match.isLive}
                isFavorite={isPersonalizedFavoriteMatch(match, rankingContext)}
                scoreFlash={scoreFlashById?.[match.id]}
                lastBall={lastBallCommentaryLine(match.commentary)}
                startTimeIso={match.startTimeIso}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
