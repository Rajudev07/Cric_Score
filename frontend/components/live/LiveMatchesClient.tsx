"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HomeMatchTabs from "@/components/home/HomeMatchTabs";
import RevalidatingIcon from "@/components/live/RevalidatingIcon";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/data/matches";
import { useLiveFeedUpdateDetection } from "@/lib/hooks/useLiveFeedUpdateDetection";
import { useMatchStartNotifications } from "@/lib/hooks/useMatchStartNotifications";
import { useLiveMatchesFeed } from "@/lib/hooks/useLiveMatches";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import type { ScoreFlash } from "@/lib/types/live";
import { preferencesToPriorityContext } from "@/lib/user/ranking";
import { debugLogHomeIngest } from "@/lib/utils/matchPriority";

interface LiveMatchesClientProps {
  fixtureMatches: Match[];
  fallbackCurrent: Match[];
}

export default function LiveMatchesClient({
  fixtureMatches,
  fallbackCurrent,
}: LiveMatchesClientProps) {
  const [timeMounted, setTimeMounted] = useState(false);
  const { prefs, ready: prefsReady } = useUserPreferences();

  const rankingContext = useMemo(
    () => (prefsReady ? preferencesToPriorityContext(prefs) : undefined),
    [prefs, prefsReady]
  );

  useEffect(() => {
    setTimeMounted(true);
  }, []);

  const { buckets, isValidating, lastUpdated, error, rawCurrent, mutate } =
    useLiveMatchesFeed(fixtureMatches, fallbackCurrent, rankingContext);

  useLiveFeedUpdateDetection(rawCurrent);
  useMatchStartNotifications(rawCurrent);

  const router = useRouter();
  useEffect(() => {
    for (const m of buckets.live.slice(0, 3)) {
      router.prefetch(`/match/${m.id}`);
    }
  }, [buckets.live, router]);

  useEffect(() => {
    debugLogHomeIngest(rawCurrent, fixtureMatches);
  }, [rawCurrent, fixtureMatches]);

  const prevLiveRef = useRef<Map<string, Match>>(new Map());

  const flashById = useMemo(() => {
    const out: Record<string, ScoreFlash> = {};
    for (const m of buckets.live) {
      const prev = prevLiveRef.current.get(m.id);
      if (prev) {
        out[m.id] = {
          score1: prev.score1 !== m.score1,
          score2: prev.score2 !== m.score2,
          overs: prev.overs !== m.overs,
          status: prev.status !== m.status,
        };
      }
    }
    return out;
  }, [buckets.live]);

  useLayoutEffect(() => {
    prevLiveRef.current = new Map(buckets.live.map((m) => [m.id, m]));
  }, [buckets.live]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <span>
          {error ? (
            <span className="inline-flex flex-wrap items-center gap-3 text-red-400/90">
              <span>Live refresh paused: {error.message}</span>
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
          ) : buckets.live.length > 0 ? (
            <>
              Auto-refresh on · updated{" "}
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
                  <RevalidatingIcon active />
                  Refreshing…
                </span>
              ) : null}
            </>
          ) : (
            <span>Polling paused — no live matches in feed</span>
          )}
        </span>
      </div>

      <HomeMatchTabs
        live={buckets.live}
        upcoming={buckets.upcoming}
        completed={buckets.completed}
        scoreFlashById={flashById}
        rankingContext={rankingContext}
      />
    </div>
  );
}
