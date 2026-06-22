"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import type { AnalyticsEvent } from "@/lib/analytics/events";
import { registerAnalyticsSink } from "@/lib/analytics/track";

function forwardToPosthog(event: AnalyticsEvent): void {
  try {
    switch (event.kind) {
      case "page_view":
        posthog.capture("$pageview", { path: event.path, referrer: event.referrer });
        break;
      case "match_open":
        posthog.capture("match_open", { match_id: event.matchId, path: event.path });
        break;
      case "favorite_toggle":
        posthog.capture("favorite_toggle", { team_id: event.teamId, action: event.action });
        break;
      case "search_submit":
        posthog.capture("search_submit", {
          query_length: event.queryLength,
          results_count: event.resultsCount,
        });
        break;
      case "live_feed_refresh":
        posthog.capture("live_feed_refresh", { live_count: event.liveCount });
        break;
      case "engagement_session":
        posthog.capture("engagement_session", {
          path: event.path,
          visible_seconds: event.visibleSeconds,
        });
        break;
      default:
        break;
    }
  } catch {
    /* vendor isolation */
  }
}

export default function PosthogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
    if (!key) return;
    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      persistence: "localStorage+cookie",
    });
    return registerAnalyticsSink(forwardToPosthog);
  }, []);

  return null;
}
