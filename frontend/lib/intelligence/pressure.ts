import type { Match } from "@/lib/data/matches";
import type { BallEvent } from "@/lib/utils/liveMatchDerived";
import type { MomentumSnapshot } from "@/lib/utils/momentum";

export interface PressureProfile {
  chasePressure: number;
  battingPressure: number;
  bowlingPressure: number;
  clutchMoment: boolean;
  label: string;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function parseNeed(status: string): { runs: number; balls: number } | null {
  const m = status.match(/need\s+(\d+)\s+from\s+(\d+)/i);
  if (!m) return null;
  const runs = parseInt(m[1], 10);
  const balls = parseInt(m[2], 10);
  if (!Number.isFinite(runs) || !Number.isFinite(balls) || balls <= 0) return null;
  return { runs, balls };
}

function dotPressureLast(balls: BallEvent[], n: number): number {
  const t = balls.slice(-n);
  if (!t.length) return 40;
  const dots = t.filter(
    (b) => b.kind === "dot" || (b.kind === "runs" && b.runs === 0)
  ).length;
  return clamp((dots / t.length) * 100, 8, 95);
}

/**
 * Numeric pressure rails derived from chase equation, dot density, and momentum tilt.
 */
export function analyzePressure(
  match: Match,
  ballEvents: BallEvent[],
  momentum: MomentumSnapshot
): PressureProfile {
  const need = parseNeed(match.status);
  let chasePressure = 38;
  let clutchMoment = false;

  if (need) {
    const rpb = need.runs / need.balls;
    chasePressure = clamp(rpb * 34 + (need.balls <= 12 ? 22 : 0), 12, 98);
    clutchMoment = need.balls <= 18 && need.runs > 0 && need.runs <= 30;
  }

  const wkRecent = ballEvents.slice(-14).filter((b) => b.kind === "wicket").length;
  const battingPressure = clamp(
    dotPressureLast(ballEvents, 14) * 0.55 + wkRecent * 14 + (momentum.battingPressure === "high" ? 18 : 0),
    10,
    98
  );

  const bowlingPressure = clamp(
    100 - momentum.score * 0.35 + wkRecent * 10,
    12,
    96
  );

  const label = clutchMoment
    ? "Death overs — high leverage"
    : need
      ? "Chase pressure elevated"
      : momentum.label;

  return {
    chasePressure: Math.round(chasePressure),
    battingPressure: Math.round(battingPressure),
    bowlingPressure: Math.round(bowlingPressure),
    clutchMoment,
    label,
  };
}
