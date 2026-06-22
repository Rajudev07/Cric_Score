import type { Match } from "@/lib/data/matches";
import type { BallEvent, RecentOver } from "@/lib/utils/liveMatchDerived";
import type { MomentumSnapshot } from "@/lib/utils/momentum";

export type WinProbabilityEstimate = {
  team1Pct: number;
  team2Pct: number;
  favored: "team1" | "team2" | "even";
  confidence: number;
  chaseActive: boolean;
  chasingTeam: "team1" | "team2" | null;
  note: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function parseNeed(status: string): { runs: number; balls: number; prefix: string } | null {
  const m = status.match(/^([^,]{2,48}?)\s+need\s+(\d+)\s+from\s+(\d+)/i);
  if (!m) return null;
  const runs = parseInt(m[2], 10);
  const balls = parseInt(m[3], 10);
  if (!Number.isFinite(runs) || !Number.isFinite(balls) || balls <= 0) return null;
  return { runs, balls, prefix: m[1].trim() };
}

function teamFromPrefix(prefix: string, team1: string, team2: string): "team1" | "team2" | null {
  const p = prefix.toLowerCase();
  const t1 = team1.toLowerCase();
  const t2 = team2.toLowerCase();
  if (p.includes(t1.slice(0, 4)) || t1.includes(p.slice(0, 4))) return "team1";
  if (p.includes(t2.slice(0, 4)) || t2.includes(p.slice(0, 4))) return "team2";
  return null;
}

function runsLastNBalls(balls: BallEvent[], n: number): { runs: number; count: number } {
  const tail = balls.slice(-n);
  let runs = 0;
  for (const b of tail) {
    if (b.kind === "wide" || b.kind === "noball") runs += b.runs;
    else runs += b.runs;
  }
  return { runs, count: tail.length || 1 };
}

function oversCapFromMatchType(mt: string): number {
  const s = mt.toLowerCase();
  if (/t20|20-?over/i.test(s)) return 20;
  if (/odi|50-?over|one[- ]day/i.test(s)) return 50;
  if (/test/i.test(s)) return 110;
  return 20;
}

/**
 * Heuristic win probability for limited-overs contexts. Chase equation + recent
 * ball productivity + momentum tilt; falls back to near-even when signals are weak.
 */
export function estimateWinProbability(
  match: Match,
  ballEvents: BallEvent[],
  momentum: MomentumSnapshot,
  recentOvers: RecentOver[]
): WinProbabilityEstimate {
  const need = parseNeed(match.status);
  const tail = runsLastNBalls(ballEvents, 18);
  const currentRpo = (tail.runs / tail.count) * 6;

  if (need) {
    const chasing = teamFromPrefix(need.prefix, match.team1, match.team2);
    const reqRpo = (need.runs / need.balls) * 6;
    const wkPressure = need.balls <= 6 && need.runs > 0 ? 0.35 : 0;
    const edge =
      (currentRpo - reqRpo) / 14 +
      (momentum.score / 100) * 0.45 +
      wkPressure -
      (need.runs / Math.max(6, need.balls)) * 0.02;
    const pChase = clamp(sigmoid(edge * 2.2), 0.07, 0.93);
    const t1 = chasing === "team1" ? pChase : chasing === "team2" ? 1 - pChase : 0.5;
    const team1Pct = Math.round((chasing ? t1 : 0.5) * 100);
    const team2Pct = 100 - team1Pct;
    const favored: WinProbabilityEstimate["favored"] =
      team1Pct > team2Pct + 3 ? "team1" : team2Pct > team1Pct + 3 ? "team2" : "even";
    return {
      team1Pct,
      team2Pct,
      favored,
      confidence: clamp(0.35 + Math.min(need.balls, 120) / 200 + Math.abs(edge) * 0.4, 0.25, 0.9),
      chaseActive: true,
      chasingTeam: chasing,
      note: `Model blends required RPO (${reqRpo.toFixed(1)}), recent RPO (${currentRpo.toFixed(1)}), and momentum.`,
    };
  }

  const cap = oversCapFromMatchType(match.matchType);
  const lastOver = recentOvers[0];
  const lastRuns = lastOver?.balls.reduce((s, b) => s + b.runs, 0) ?? 0;
  const tilt = clamp(0.5 + momentum.score / 400 + (lastRuns - 6) / 80, 0.12, 0.88);
  const team1Pct = Math.round(tilt * 100);
  return {
    team1Pct,
    team2Pct: 100 - team1Pct,
    favored: team1Pct > 56 ? "team1" : team1Pct < 44 ? "team2" : "even",
    confidence: 0.22,
    chaseActive: false,
    chasingTeam: null,
    note: `No explicit chase equation parsed — using momentum (${momentum.label}) and last over tempo vs ~${cap} over format.`,
  };
}
