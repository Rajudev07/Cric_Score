"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import FavoriteTeamButton from "@/components/user/FavoriteTeamButton";
import FallOfWickets from "@/components/matches/FallOfWickets";
import MatchInfoPanel from "@/components/matches/MatchInfoPanel";
import MatchHighlights from "@/components/matches/MatchHighlights";
import MatchTimeline from "@/components/matches/MatchTimeline";
import MomentumBar from "@/components/matches/MomentumBar";
import PartnershipChart from "@/components/matches/PartnershipChart";
import BallTimeline from "@/components/matches/BallTimeline";
import MatchDetailTabs from "@/components/matches/MatchDetailTabs";
import RecentOvers from "@/components/matches/RecentOvers";
import CommentaryFeed from "@/components/match/CommentaryFeed";
import MatchDetailHeader from "@/components/match/MatchDetailHeader";
import MatchStatusBanner from "@/components/match/MatchStatusBanner";
import ScorecardSection from "@/components/match/ScorecardSection";
import OfflineMatchBanner from "@/components/pwa/OfflineMatchBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Match } from "@/lib/data/matches";
import { useLiveMatchDetail } from "@/lib/hooks/useLiveMatchDetail";
import { useWicketNotifications } from "@/lib/hooks/useWicketNotifications";
import RevalidatingIcon from "@/components/live/RevalidatingIcon";
import SectionErrorBoundary from "@/components/ui/SectionErrorBoundary";
import { resolveCatalogTeamIdFromLabel } from "@/lib/user/favorites";
import {
  buildRecentOvers,
  deriveFallOfWickets,
  deriveMatchInfo,
  derivePartnerships,
  parseBallEventsFromCommentary,
} from "@/lib/utils/liveMatchDerived";
import { buildMatchHighlights } from "@/lib/utils/highlights";
import { computeMomentum } from "@/lib/utils/momentum";
import { analyzeMomentumSwings } from "@/lib/intelligence/momentumAnalysis";
import { analyzePressure } from "@/lib/intelligence/pressure";
import { detectTurningPoints } from "@/lib/intelligence/turningPoints";
import { estimateWinProbability } from "@/lib/intelligence/winProbability";
import { generateMatchSummary } from "@/lib/intelligence/matchSummary";

const MatchIntelligenceGrid = dynamic(
  () => import("@/components/live/MatchIntelligenceGrid"),
  {
    loading: () => (
      <div className="h-44 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950/60" />
    ),
  }
);

interface LiveMatchDetailViewProps {
  initialMatch: Match;
}

export default function LiveMatchDetailView({
  initialMatch,
}: LiveMatchDetailViewProps) {
  const [timeMounted, setTimeMounted] = useState(false);
  useEffect(() => {
    setTimeMounted(true);
  }, []);

  const { match, isValidating, lastUpdated, error, mutate } =
    useLiveMatchDetail(initialMatch);

  useWicketNotifications(match);

  const team1CatalogId = useMemo(
    () => resolveCatalogTeamIdFromLabel(match.team1),
    [match.team1]
  );
  const team2CatalogId = useMemo(
    () => resolveCatalogTeamIdFromLabel(match.team2),
    [match.team2]
  );

  const prev = useRef(initialMatch);

  const flash = useMemo(() => {
    const p = prev.current;
    const m = match;
    return {
      score1: p.score1 !== m.score1,
      score2: p.score2 !== m.score2,
      overs: p.overs !== m.overs,
      status: p.status !== m.status,
    };
  }, [match]);

  useLayoutEffect(() => {
    prev.current = match;
  }, [match]);

  const liveDerived = useMemo(() => {
    const ballEvents = parseBallEventsFromCommentary(match.commentary);
    const recentOvers = buildRecentOvers(ballEvents, 5);
    const momentum = computeMomentum(match, ballEvents);
    const winProb = estimateWinProbability(match, ballEvents, momentum, recentOvers);
    const swings = analyzeMomentumSwings(ballEvents, recentOvers);
    const tps = detectTurningPoints(ballEvents, match, recentOvers);
    const pressure = analyzePressure(match, ballEvents, momentum);
    const summary = generateMatchSummary(match, momentum, tps, recentOvers);
    return {
      ballEvents,
      recentOvers,
      partnerships: derivePartnerships(match.commentary, match.batting),
      fallOfWickets: deriveFallOfWickets(match.commentary),
      matchInfo: deriveMatchInfo(match),
      momentum,
      highlights: buildMatchHighlights(match),
      winProb,
      swings,
      tps,
      pressure,
      summary,
    };
  }, [match]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-hidden px-0">
      <OfflineMatchBanner matchId={match.id} />

      {match.isLive ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span>
            {error ? (
              <span className="inline-flex flex-wrap items-center gap-3 text-red-400/90">
                <span>{error.message}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] border-red-900/50 bg-red-950/30 text-xs font-semibold text-red-100 hover:bg-red-950/50"
                  onClick={() => void mutate()}
                >
                  Retry
                </Button>
              </span>
            ) : (
              <>
                Live updates ·{" "}
                <time
                  suppressHydrationWarning
                  dateTime={
                    timeMounted ? lastUpdated.toISOString() : undefined
                  }
                  className="font-medium tabular-nums text-zinc-400"
                >
                  {timeMounted
                    ? lastUpdated.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "—"}
                </time>
                {isValidating ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-400/90">
                    Refreshing…
                    <RevalidatingIcon active={isValidating} />
                  </span>
                ) : null}
              </>
            )}
          </span>
        </div>
      ) : null}

      <SectionErrorBoundary label="match-tabs">
        <MatchDetailTabs
          stickyHeader={
            <MatchDetailHeader match={match} flash={flash} isValidating={isValidating}>
              <div className="mt-2 flex flex-wrap gap-2">
                <FavoriteTeamButton teamId={team1CatalogId} />
                <FavoriteTeamButton teamId={team2CatalogId} />
              </div>
            </MatchDetailHeader>
          }
          summary={
            <div className="space-y-6">
              <MatchStatusBanner match={match} />
              <div className="grid gap-6 lg:grid-cols-2">
                <MatchInfoPanel
                  info={liveDerived.matchInfo}
                  isRefreshing={isValidating}
                />
                <RecentOvers
                  overs={liveDerived.recentOvers}
                  isRefreshing={isValidating}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <SectionErrorBoundary label="partnerships">
                  <PartnershipChart
                    partnerships={liveDerived.partnerships}
                    isRefreshing={isValidating}
                  />
                </SectionErrorBoundary>
                <FallOfWickets
                  wickets={liveDerived.fallOfWickets}
                  isRefreshing={isValidating}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900 ring-zinc-800">
                  <CardHeader className="border-b border-zinc-800 pb-4">
                    <CardTitle className="text-lg text-zinc-100">Ball timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto pt-4">
                    <BallTimeline events={liveDerived.ballEvents} />
                  </CardContent>
                </Card>
                <MomentumBar
                  momentum={liveDerived.momentum}
                  isRefreshing={isValidating}
                />
              </div>
              <MatchHighlights
                highlights={liveDerived.highlights}
                isRefreshing={isValidating}
              />
              <SectionErrorBoundary label="win-probability">
                <MatchIntelligenceGrid
                  matchId={match.id}
                  winProb={liveDerived.winProb}
                  pressure={liveDerived.pressure}
                  swings={liveDerived.swings}
                  tps={liveDerived.tps}
                  summary={liveDerived.summary}
                  team1={match.team1}
                  team2={match.team2}
                />
              </SectionErrorBoundary>
            </div>
          }
          scorecard={
            <div className="space-y-6">
              <MatchStatusBanner match={match} />
              <SectionErrorBoundary label="scorecard">
                <ScorecardSection batting={match.batting} bowling={match.bowling} />
              </SectionErrorBoundary>
            </div>
          }
          commentary={
            <div className="space-y-6">
              <MatchStatusBanner match={match} />
              <SectionErrorBoundary label="commentary-timeline">
                <MatchTimeline
                  commentary={match.commentary}
                  isRefreshing={isValidating}
                />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="commentary-feed">
                <CommentaryFeed items={match.commentary} />
              </SectionErrorBoundary>
            </div>
          }
        />
      </SectionErrorBoundary>
    </div>
  );
}
