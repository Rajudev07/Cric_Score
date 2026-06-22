import type { Match } from "@/lib/data/matches";
import type { BallEvent } from "@/lib/utils/liveMatchDerived";
import type { RecentOver } from "@/lib/utils/liveMatchDerived";

export type TurningPointTag = "wicket" | "over" | "partnership_break" | "power_surge";

export interface TurningPoint {
  overLabel: string;
  title: string;
  explanation: string;
  impact: number;
  tag: TurningPointTag;
}

function overRuns(balls: BallEvent[]): number {
  return balls.reduce((s, b) => s + b.runs, 0);
}

/**
 * Lightweight turning-point detector from ball events + commentary-adjacent overs.
 */
export function detectTurningPoints(
  ballEvents: BallEvent[],
  match: Match,
  recentOvers: RecentOver[]
): TurningPoint[] {
  const pts: TurningPoint[] = [];
  const chrono = [...recentOvers].reverse();

  for (const o of chrono) {
    const runs = overRuns(o.balls);
    const wk = o.balls.filter((b) => b.kind === "wicket").length;
    const label = `${o.overNumber}.x`;

    if (wk >= 1) {
      const impact = clamp(38 + wk * 18 + Math.min(runs, 12) * 2, 35, 96);
      pts.push({
        overLabel: `Over ${o.overNumber}`,
        title: wk >= 2 ? "Double-wicket over" : "Breakthrough wicket",
        explanation: `${wk} wicket(s) in over ${o.overNumber} shifted control${
          runs ? ` after ${runs} runs in the over` : ""
        }.`,
        impact,
        tag: wk >= 2 ? "partnership_break" : "wicket",
      });
    } else if (runs >= 16) {
      pts.push({
        overLabel: `Over ${o.overNumber}`,
        title: "Boundary burst",
        explanation: `${runs} runs plundered in a single over — momentum swing for the batting side.`,
        impact: clamp(42 + runs, 40, 95),
        tag: "power_surge",
      });
    } else if (runs <= 2 && o.balls.length >= 5) {
      pts.push({
        overLabel: `Over ${o.overNumber}`,
        title: "Tight over",
        explanation: "Dot-heavy over builds scoreboard pressure even without wickets.",
        impact: 34,
        tag: "over",
      });
    }
  }

  const need = match.status.match(/need\s+(\d+)\s+from\s+(\d+)/i);
  if (need) {
    const runs = parseInt(need[1], 10);
    const balls = parseInt(need[2], 10);
    if (runs > 0 && balls <= 12) {
      pts.push({
        overLabel: "death",
        title: "Clutch chase equation",
        explanation: `Equation tight: ${runs} needed from ${balls} balls — every delivery swings win probability.`,
        impact: 88,
        tag: "over",
      });
    }
  }

  const lastBall = ballEvents[ballEvents.length - 1];
  if (lastBall && lastBall.kind === "six") {
    pts.push({
      overLabel: String(lastBall.ballDecimal),
      title: "Late six",
      explanation: "Maximum off the last parsed ball — intent signal in a live passage.",
      impact: 52,
      tag: "power_surge",
    });
  }

  const key = new Set<string>();
  const uniq: TurningPoint[] = [];
  for (const p of pts) {
    const k = `${p.tag}:${p.overLabel}:${p.title}`;
    if (key.has(k)) continue;
    key.add(k);
    uniq.push(p);
  }
  return uniq.sort((a, b) => b.impact - a.impact).slice(0, 6);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
