"use client";

import { useEffect, useRef } from "react";
import type { Match } from "@/lib/data/matches";
import { getMatchPhase } from "@/lib/utils/matchPriority";
import { isMatchNotifySubscribed } from "@/lib/notifications/subscriptions";
import { showBrowserNotification } from "@/lib/notifications/browserNotify";

/** Fire local notifications when a subscribed upcoming match turns live. */
export function useMatchStartNotifications(matches: Match[]): void {
  const prevPhase = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const next = new Map<string, string>();
    for (const m of matches) {
      const phase = getMatchPhase(m);
      next.set(m.id, phase);
      const was = prevPhase.current.get(m.id);
      if (
        was === "upcoming" &&
        phase === "live" &&
        isMatchNotifySubscribed(m.id)
      ) {
        void showBrowserNotification(`${m.team1} vs ${m.team2} is LIVE`, {
          body: m.league,
          tag: `match-live-${m.id}`,
        });
      }
    }
    prevPhase.current = next;
  }, [matches]);
}
