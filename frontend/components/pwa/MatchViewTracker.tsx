"use client";

import { useEffect } from "react";
import {
  incrementMatchViewCount,
  recordOfflineMatchMeta,
} from "@/lib/pwa/matchViews";
import { recordRecentView } from "@/lib/search/ranking";

export default function MatchViewTracker({ matchId }: { matchId: string }) {
  useEffect(() => {
    incrementMatchViewCount();
    recordOfflineMatchMeta(matchId);
    recordRecentView(`/match/${encodeURIComponent(matchId)}`);
  }, [matchId]);

  return null;
}
