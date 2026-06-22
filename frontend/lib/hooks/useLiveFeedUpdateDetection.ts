"use client";

import { useEffect, useRef } from "react";
import type { Match } from "@/lib/data/matches";
import { detectFeedBatchEvents } from "@/lib/notifications/detectUpdates";

export function useLiveFeedUpdateDetection(matches: Match[]): void {
  const prev = useRef<Match[]>([]);
  useEffect(() => {
    if (prev.current.length) {
      detectFeedBatchEvents(prev.current, matches, "live_feed");
    }
    prev.current = matches;
  }, [matches]);
}
