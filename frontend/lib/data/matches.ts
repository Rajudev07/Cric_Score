export interface BattingRow {
  batter: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
}

export interface BowlingRow {
  bowler: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
}

export interface CommentaryItem {
  over: string;
  text: string;
}

/** Canonical match shape used across UI — populated via API + transform layer */
export interface Match {
  id: string;
  /** Data source id for aggregation / debugging */
  provider: string;
  league: string;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  overs: string;
  status: string;
  isLive: boolean;
  /** From provider when available — drives tab classification */
  matchStarted: boolean;
  matchEnded: boolean;
  /** e.g. T20, ODI — used for priority + cards */
  matchType: string;
  /** ISO-ish datetime from provider for sorting (nullable if unknown) */
  startTimeIso: string | null;
  batting: BattingRow[];
  bowling: BowlingRow[];
  commentary: CommentaryItem[];
  /** Federation: providers that contributed rows merged into this match */
  providerSources?: string[];
  /** 0–100 heuristic from multi-provider agreement + payload richness */
  confidenceScore?: number;
  /** Provider chosen as primary identity for this merged row */
  primaryProvider?: string;
  /** Weighted richness after federation merge */
  richnessScore?: number;
  /** Provider payload freshness (ms epoch) for conflict resolution */
  updatedAt?: number | null;
}
