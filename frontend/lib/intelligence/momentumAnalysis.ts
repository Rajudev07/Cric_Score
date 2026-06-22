import type { BallEvent } from "@/lib/utils/liveMatchDerived";
import type { RecentOver } from "@/lib/utils/liveMatchDerived";

export type MomentumInsightKind =
  | "swing_batting"
  | "swing_bowling"
  | "expensive_over"
  | "wicket_cluster"
  | "acceleration"
  | "quiet_phase";

export interface MomentumInsight {
  kind: MomentumInsightKind;
  severity: "low" | "mid" | "high";
  overLabel: string;
  title: string;
  detail: string;
}

function overRuns(balls: BallEvent[]): number {
  return balls.reduce((s, b) => s + b.runs, 0);
}

function wicketCount(balls: BallEvent[]): number {
  return balls.filter((b) => b.kind === "wicket").length;
}

/**
 * Surface swings, expensive overs, wicket clusters, and acceleration windows
 * from parsed ball events and recent over buckets.
 */
export function analyzeMomentumSwings(
  ballEvents: BallEvent[],
  recentOvers: RecentOver[]
): MomentumInsight[] {
  const out: MomentumInsight[] = [];
  if (!recentOvers.length) return out;

  const chronological = [...recentOvers].reverse();

  for (let i = 1; i < chronological.length; i++) {
    const prev = chronological[i - 1];
    const cur = chronological[i];
    const pr = overRuns(prev.balls);
    const cr = overRuns(cur.balls);
    const delta = cr - pr;
    const label = `Over ${cur.overNumber}`;

    if (cr >= 14) {
      out.push({
        kind: "expensive_over",
        severity: cr >= 20 ? "high" : "mid",
        overLabel: label,
        title: "Expensive over",
        detail: `${cr} runs came in ${label.toLowerCase()} — bowling under pressure.`,
      });
    }

    if (delta >= 10) {
      out.push({
        kind: "swing_batting",
        severity: delta >= 16 ? "high" : "mid",
        overLabel: label,
        title: "Batting surge",
        detail: `Run-rate jumped sharply vs the prior over (+${delta} runs).`,
      });
    } else if (delta <= -10 && pr >= 8) {
      out.push({
        kind: "swing_bowling",
        severity: "mid",
        overLabel: label,
        title: "Bowling squeeze",
        detail: `Scoring dried up after a productive over (Δ ${delta} runs).`,
      });
    }
  }

  const tail = ballEvents.slice(-18);
  const wkTail = tail.filter((b) => b.kind === "wicket").length;
  if (wkTail >= 2) {
    const lastW = [...tail].reverse().find((b) => b.kind === "wicket");
    out.push({
      kind: "wicket_cluster",
      severity: wkTail >= 3 ? "high" : "mid",
      overLabel: lastW ? `${lastW.overInt}.${Math.round((lastW.ballDecimal % 1) * 10)}` : "recent",
      title: "Wicket cluster",
      detail: `${wkTail} wickets fell inside the latest ~3 overs of parsed balls.`,
    });
  }

  const a = runsLast(ballEvents, 12);
  const b = runsLast(ballEvents.slice(0, -12), 12);
  if (a.count >= 8 && b.count >= 8 && a.runs - b.runs >= 10) {
    out.push({
      kind: "acceleration",
      severity: "mid",
      overLabel: "last 12b",
      title: "Acceleration phase",
      detail: `Last twelve balls produced ${a.runs} runs vs ${b.runs} in the prior dozen.`,
    });
  }

  const last = chronological[chronological.length - 1];
  if (last && overRuns(last.balls) <= 3 && wicketCount(last.balls) === 0) {
    out.push({
      kind: "quiet_phase",
      severity: "low",
      overLabel: `Over ${last.overNumber}`,
      title: "Quiet over",
      detail: "Dot-heavy passage — batters consolidating or bowlers tightening lines.",
    });
  }

  const dedup = new Map<string, MomentumInsight>();
  for (const x of out) {
    dedup.set(`${x.kind}:${x.overLabel}:${x.title}`, x);
  }
  return [...dedup.values()].slice(-8);
}

function runsLast(balls: BallEvent[], n: number): { runs: number; count: number } {
  const t = balls.slice(-n);
  return { runs: t.reduce((s, b) => s + b.runs, 0), count: t.length };
}
