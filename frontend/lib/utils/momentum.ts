import type { Match } from "@/lib/data/matches";
import type { BallEvent } from "@/lib/utils/liveMatchDerived";

export interface MomentumSnapshot {
  /** -100 … +100, batting momentum positive */
  score: number;
  label: string;
  battingPressure: "low" | "mid" | "high";
  chaseDifficulty?: string;
}

function parseNeedFromStatus(status: string): { runs: number; balls: number } | null {
  const m = status.match(/need\s+(\d+)\s+from\s+(\d+)/i);
  if (!m) return null;
  const runs = parseInt(m[1], 10);
  const balls = parseInt(m[2], 10);
  if (!Number.isFinite(runs) || !Number.isFinite(balls) || balls <= 0) return null;
  return { runs, balls };
}

/**
 * Lightweight momentum from recent ball events + chase equation in status.
 */
export function computeMomentum(
  match: Match,
  recentBalls: BallEvent[]
): MomentumSnapshot {
  const tail = recentBalls.slice(-24);
  let raw = 0;
  let wk = 0;
  for (const b of tail) {
    if (b.kind === "wicket") {
      raw -= 22;
      wk += 1;
    } else raw += b.runs * 3;
    if (b.kind === "four") raw += 4;
    if (b.kind === "six") raw += 6;
  }
  raw = Math.max(-100, Math.min(100, raw));

  const need = parseNeedFromStatus(match.status);
  let chaseDifficulty: string | undefined;
  if (need) {
    const rpb = need.runs / need.balls;
    if (rpb > 2.5) chaseDifficulty = "Steep — high pressure chase";
    else if (rpb > 1.5) chaseDifficulty = "Moderate — equation tight";
    else chaseDifficulty = "Comfortable — cruising";
    if (need.balls <= 6 && need.runs > 0) {
      raw = Math.min(100, raw + 15);
    }
  }

  let battingPressure: "low" | "mid" | "high" = "mid";
  if (wk >= 3) battingPressure = "high";
  else if (wk === 0 && raw > 20) battingPressure = "low";

  const label =
    raw > 25
      ? "Batting ascendancy"
      : raw < -25
        ? "Bowling control"
        : "Even contest";

  return {
    score: raw,
    label,
    battingPressure,
    chaseDifficulty,
  };
}
