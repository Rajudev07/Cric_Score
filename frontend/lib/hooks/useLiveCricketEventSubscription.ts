"use client";

import { useEffect, useRef } from "react";
import type { CricketLiveEvent } from "@/lib/notifications/types";
import { subscribeLiveCricketEvents } from "@/lib/notifications/bus";

export function useLiveCricketEventSubscription(
  handler: (event: CricketLiveEvent) => void
): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    return subscribeLiveCricketEvents((e) => {
      ref.current(e);
    });
  }, []);
}
