"use client";

import { useEffect, useRef } from "react";
import type { Match } from "@/lib/data/matches";
import { detectMatchUpdateEvents } from "@/lib/notifications/detectUpdates";
import type { CricketEventSource } from "@/lib/notifications/types";

export function useMatchSnapshotEvents(match: Match, source: CricketEventSource): void {
  const prev = useRef<Match | null>(null);
  useEffect(() => {
    if (prev.current) {
      detectMatchUpdateEvents(prev.current, match, source);
    }
    prev.current = match;
  }, [match, source]);
}
