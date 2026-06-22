/** Typed analytics events — dispatch-only; wire vendors later via `dispatchAnalytics`. */

export type AnalyticsPageViewPayload = {
  kind: "page_view";
  path: string;
  referrer?: string;
};

export type AnalyticsMatchOpenPayload = {
  kind: "match_open";
  matchId: string;
  path: string;
};

export type AnalyticsFavoritePayload = {
  kind: "favorite_toggle";
  teamId: string;
  action: "add" | "remove";
};

export type AnalyticsSearchPayload = {
  kind: "search_submit";
  queryLength: number;
  resultsCount: number;
};

export type AnalyticsLiveEngagementPayload = {
  kind: "live_feed_refresh";
  liveCount: number;
};

export type AnalyticsEngagementSessionPayload = {
  kind: "engagement_session";
  path: string;
  visibleSeconds: number;
};

export type AnalyticsEvent =
  | AnalyticsPageViewPayload
  | AnalyticsMatchOpenPayload
  | AnalyticsFavoritePayload
  | AnalyticsSearchPayload
  | AnalyticsLiveEngagementPayload
  | AnalyticsEngagementSessionPayload;
