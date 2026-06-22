import { ingestDebugEnabled } from "@/lib/utils/ingestDebugFlags";

const TAG = "[cricscore:reject-debug]";

export type RejectDebugPayload = {
  reason: string;
  url?: string;
  title?: string;
  team1?: string;
  team2?: string;
  isLive?: boolean;
  overs?: string;
  score1?: string;
  score2?: string;
  status?: string;
  stage?: string;
};

/** Counters for one ingest cycle — call {@link resetCricbuzzIngestCounters} at scraper start. */
export const cricbuzzIngestCounters = {
  pagesFetched: 0,
  pagesValidated: 0,
  pagesRejected: 0,
  matchesEmitted: 0,
};

export function resetCricbuzzIngestCounters(): void {
  cricbuzzIngestCounters.pagesFetched = 0;
  cricbuzzIngestCounters.pagesValidated = 0;
  cricbuzzIngestCounters.pagesRejected = 0;
  cricbuzzIngestCounters.matchesEmitted = 0;
}

export function bumpCricbuzzPagesFetched(): void {
  cricbuzzIngestCounters.pagesFetched++;
}

export function bumpCricbuzzPagesValidated(): void {
  cricbuzzIngestCounters.pagesValidated++;
}

export function bumpCricbuzzPagesRejected(): void {
  cricbuzzIngestCounters.pagesRejected++;
}

export function bumpCricbuzzMatchesEmitted(n = 1): void {
  cricbuzzIngestCounters.matchesEmitted += n;
}

export function logRejectDebug(payload: RejectDebugPayload): void {
  if (process.env.NODE_ENV !== "development" && !ingestDebugEnabled()) return;
  console.log(TAG, payload);
}

export function getCricbuzzIngestCountersSnapshot(): typeof cricbuzzIngestCounters {
  return { ...cricbuzzIngestCounters };
}
