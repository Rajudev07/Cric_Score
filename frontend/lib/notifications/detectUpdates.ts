import type { Match } from "@/lib/data/matches";
import { emitLiveCricketEvent } from "@/lib/notifications/bus";
import type { CricketEventSource } from "@/lib/notifications/types";

function nowIso(): string {
  return new Date().toISOString();
}

function statusSuggestsCloseFinish(status: string): boolean {
  const s = status.toLowerCase();
  return (
    /\b\d+\s*runs?\s*needed\b/.test(s) ||
    /\bneed\b.*\bfrom\b/.test(s) ||
    /\boff\s*\d+\s*balls?\b/.test(s) ||
    /\breq\.?\s*rpo\b/.test(s)
  );
}

function statusSuggestsWicket(status: string): boolean {
  const s = status.toLowerCase();
  return /\bwicket\b|\bwkts?\b|\bowl(?:ed)?\b.*\bout\b/.test(s);
}

/** Diff two match snapshots and emit structured events (no browser notifications). */
export function detectMatchUpdateEvents(
  prev: Match | null,
  next: Match,
  source: CricketEventSource
): void {
  if (!prev) {
    return;
  }

  if (prev.id !== next.id) {
    if (next.matchStarted && !next.matchEnded) {
      emitLiveCricketEvent({
        kind: "match_start",
        source,
        matchId: next.id,
        league: next.league,
        team1: next.team1,
        team2: next.team2,
        status: next.status,
        capturedAtIso: nowIso(),
      });
    }
    return;
  }

  const scoreChanged =
    prev.score1 !== next.score1 ||
    prev.score2 !== next.score2 ||
    prev.overs !== next.overs ||
    prev.status !== next.status;

  if (scoreChanged) {
    emitLiveCricketEvent({
      kind: "scorecard_update",
      source,
      matchId: next.id,
      league: next.league,
      team1: next.team1,
      team2: next.team2,
      score1: next.score1,
      score2: next.score2,
      overs: next.overs,
      status: next.status,
      capturedAtIso: nowIso(),
    });
  }

  if (statusSuggestsWicket(next.status) && prev.status !== next.status) {
    emitLiveCricketEvent({
      kind: "wicket",
      source,
      matchId: next.id,
      league: next.league,
      team1: next.team1,
      team2: next.team2,
      hint: next.status,
      capturedAtIso: nowIso(),
    });
  }

  if (statusSuggestsCloseFinish(next.status) && prev.status !== next.status) {
    emitLiveCricketEvent({
      kind: "close_finish",
      source,
      matchId: next.id,
      league: next.league,
      team1: next.team1,
      team2: next.team2,
      status: next.status,
      capturedAtIso: nowIso(),
    });
  }
}

export function detectFeedBatchEvents(
  prev: Match[],
  next: Match[],
  source: CricketEventSource
): void {
  const pmap = new Map(prev.map((m) => [m.id, m]));
  for (const m of next) {
    detectMatchUpdateEvents(pmap.get(m.id) ?? null, m, source);
  }
}
