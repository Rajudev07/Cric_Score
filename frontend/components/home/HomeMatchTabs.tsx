"use client";

import { useMemo, useState } from "react";
import type { ScoreFlash } from "@/lib/types/live";
import EmptyState from "@/components/home/EmptyState";
import FeaturedMatch, { isHighProfileFeaturedMatch } from "@/components/home/FeaturedMatch";
import MatchCard from "@/components/matches/MatchCard";
import MatchNotifyBell from "@/components/notifications/MatchNotifyBell";
import type { Match } from "@/lib/data/matches";
import { lastBallCommentaryLine } from "@/lib/utils/lastBall";
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

  const featuredMatch = useMemo(
    () => live.find((m) => isHighProfileFeaturedMatch(m)) ?? null,
    [live]
  );
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

      {tab === "live" && activeList.length === 0 && !featuredMatch ? (
        <EmptyState tab="live" upcoming={upcoming} />
      ) : tab !== "live" && activeList.length === 0 ? (
        <EmptyState tab={tab} upcoming={upcoming} />
      ) : activeList.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {activeList.map((match) => (
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
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
