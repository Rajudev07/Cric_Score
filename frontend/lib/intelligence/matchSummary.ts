import type { Match } from "@/lib/data/matches";
import type { MomentumSnapshot } from "@/lib/utils/momentum";
import type { TurningPoint } from "@/lib/intelligence/turningPoints";
import type { RecentOver } from "@/lib/utils/liveMatchDerived";

export interface MatchSummaryBundle {
  liveLine: string;
  inningsLine: string;
  chaseLine?: string;
  recapLine: string;
}

function lastOverSnippet(overs: RecentOver[]): string {
  const o = overs[0];
  if (!o?.balls.length) return "Recent overs not parsed yet.";
  const runs = o.balls.reduce((s, b) => s + b.runs, 0);
  return `Latest parsed over ${o.overNumber}: ${runs} runs from ${o.balls.length} balls.`;
}

/**
 * Template-driven narrative (no external LLM). Uses status, scores, momentum,
 * turning points, and recent-over snippets for readable copy.
 */
export function generateMatchSummary(
  match: Match,
  momentum: MomentumSnapshot,
  turningPoints: TurningPoint[],
  recentOvers: RecentOver[]
): MatchSummaryBundle {
  const liveLine = `${match.team1} ${match.score1} · ${match.team2} ${match.score2} — ${match.overs}. ${match.status}`;

  const inningsLine = `Match tempo reads as "${momentum.label}" with batting pressure ${momentum.battingPressure}.`;

  const chaseLine = momentum.chaseDifficulty
    ? `Chase lens: ${momentum.chaseDifficulty}.`
    : undefined;

  const top = turningPoints[0];
  const recapLine = top
    ? `${lastOverSnippet(recentOvers)} Turning spotlight: ${top.title} — ${top.explanation}`
    : `${lastOverSnippet(recentOvers)} No dominant turning point inferred from the latest parsed overs.`;

  return { liveLine, inningsLine, chaseLine, recapLine };
}
