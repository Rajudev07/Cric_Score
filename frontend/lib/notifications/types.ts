/** Normalized payloads for future push / in-app notification channels */

export type CricketEventSource = "live_feed" | "match_detail" | "manual";

export type BaseCricketEvent = {
  source: CricketEventSource;
  matchId: string;
  league: string;
  team1: string;
  team2: string;
  capturedAtIso: string;
};

export type WicketAlertPayload = BaseCricketEvent & {
  kind: "wicket";
  hint: string;
};

export type MatchStartPayload = BaseCricketEvent & {
  kind: "match_start";
  status: string;
};

export type CloseFinishPayload = BaseCricketEvent & {
  kind: "close_finish";
  status: string;
  marginHint?: string;
};

export type ScorecardUpdatePayload = BaseCricketEvent & {
  kind: "scorecard_update";
  score1: string;
  score2: string;
  overs: string;
  status: string;
};

export type CricketLiveEvent =
  | WicketAlertPayload
  | MatchStartPayload
  | CloseFinishPayload
  | ScorecardUpdatePayload;
