"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Match } from "@/lib/data/matches";
import { useMatchSnapshotEvents } from "@/lib/hooks/useMatchUpdateDetection";

const POLL_MS = 22_500;

function sameMatchVisibleSlice(a: Match, b: Match): boolean {
  return (
    a.id === b.id &&
    a.score1 === b.score1 &&
    a.score2 === b.score2 &&
    a.overs === b.overs &&
    a.status === b.status &&
    a.isLive === b.isLive &&
    a.commentary.length === b.commentary.length &&
    a.batting.length === b.batting.length &&
    a.bowling.length === b.bowling.length
  );
}

async function fetchMatchDetail(id: string, fallback: Match): Promise<Match> {
  try {
    const res = await fetch(
      `/api/cricket/match/${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );
    const json: unknown = await res.json();
    const body = json as {
      ok?: boolean;
      data?: Match | null;
      error?: string;
      partialError?: string;
    };
    if (body.ok && body.data) {
      return body.data;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function useLiveMatchDetail(initialMatch: Match) {
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const { data, error, isValidating, mutate } = useSWR(
    initialMatch.isLive ? ["cricket-match-live", initialMatch.id] : null,
    () => fetchMatchDetail(initialMatch.id, initialMatch),
    {
      fallbackData: initialMatch,
      keepPreviousData: true,
      refreshInterval: (latest) => {
        const m = latest ?? initialMatch;
        return m.isLive ? POLL_MS : 0;
      },
      dedupingInterval: 12_000,
      compare: (a, b) => {
        if (!a || !b) return false;
        return sameMatchVisibleSlice(a, b);
      },
      errorRetryCount: 5,
      errorRetryInterval: 4000,
      revalidateOnFocus: initialMatch.isLive,
      revalidateOnReconnect: initialMatch.isLive,
      refreshWhenOffline: false,
      onSuccess() {
        setLastUpdated(new Date());
      },
    }
  );

  const match = data ?? initialMatch;

  useMatchSnapshotEvents(match, "match_detail");

  return {
    match,
    error,
    isValidating,
    lastUpdated,
    mutate,
  };
}
