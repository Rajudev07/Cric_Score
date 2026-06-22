import type { AnalyticsEvent } from "@/lib/analytics/events";

type AnalyticsSink = (event: AnalyticsEvent) => void;

const sinks: AnalyticsSink[] = [];

export function registerAnalyticsSink(sink: AnalyticsSink): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function dispatchAnalytics(event: AnalyticsEvent): void {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug("[cricscore:analytics]", event);
  }
  for (const s of sinks) {
    try {
      s(event);
    } catch {
      /* sink isolation */
    }
  }
}

let lastEngagementAt = 0;
const ENGAGEMENT_THROTTLE_MS = 60_000;

export function trackLiveFeedEngagementThrottled(liveCount: number): void {
  const now = Date.now();
  if (now - lastEngagementAt < ENGAGEMENT_THROTTLE_MS) return;
  lastEngagementAt = now;
  dispatchAnalytics({ kind: "live_feed_refresh", liveCount });
}
