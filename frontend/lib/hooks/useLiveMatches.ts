"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { Match } from "@/lib/data/matches";
import {
  buildHomeBuckets,
  type MatchPriorityContext,
} from "@/lib/utils/matchPriority";
import { trackLiveFeedEngagementThrottled } from "@/lib/analytics/track";

export type HomeBuckets = {
  live: Match[];
  upcoming: Match[];
  completed: Match[];
};

const LIVE_POLL_MS = 20_000;

async function fetchLiveCurrent(): Promise<Match[]> {
  const res = await fetch("/api/cricket/live");
  const json: unknown = await res.json();
  const body = json as { ok?: boolean; data?: Match[]; error?: string };
  if (!res.ok || !body.ok) {
    throw new Error(body.error ?? "Live feed unavailable");
  }
  if (Array.isArray(body.data)) {
    return body.data;
  }
  return [];
}

export function useLiveMatchesFeed(
  fixtureMatches: Match[],
  fallbackCurrent: Match[],
  rankingContext?: MatchPriorityContext
) {
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const { data, error, isValidating, mutate } = useSWR(
    "cricket-live-current",
    fetchLiveCurrent,
    {
      fallbackData: fallbackCurrent,
      keepPreviousData: true,
      refreshInterval: LIVE_POLL_MS,
      dedupingInterval: 8_000,
      errorRetryCount: 5,
      errorRetryInterval: 4000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      onSuccess(d) {
        setLastUpdated(new Date());
        trackLiveFeedEngagementThrottled(Array.isArray(d) ? d.length : 0);
      },
    }
  );

  const buckets = useMemo(() => {
    const current = data ?? fallbackCurrent;
    return buildHomeBuckets(current, fixtureMatches, rankingContext);
  }, [data, fallbackCurrent, fixtureMatches, rankingContext]);

  return {
    buckets,
    error,
    isValidating,
    lastUpdated,
    rawCurrent: data ?? fallbackCurrent,
    mutate,
  };
}
