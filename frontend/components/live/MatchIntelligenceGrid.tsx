"use client";

import MatchSummaryCard from "@/components/intelligence/MatchSummaryCard";
import MomentumInsights from "@/components/intelligence/MomentumInsights";
import PressureMeter from "@/components/intelligence/PressureMeter";
import TurningPointsCard from "@/components/intelligence/TurningPointsCard";
import WinProbabilityChart from "@/components/intelligence/WinProbabilityChart";
import type { MatchSummaryBundle } from "@/lib/intelligence/matchSummary";
import type { MomentumInsight } from "@/lib/intelligence/momentumAnalysis";
import type { PressureProfile } from "@/lib/intelligence/pressure";
import type { TurningPoint } from "@/lib/intelligence/turningPoints";
import type { WinProbabilityEstimate } from "@/lib/intelligence/winProbability";

export default function MatchIntelligenceGrid({
  winProb,
  pressure,
  swings,
  tps,
  summary,
  team1,
  team2,
  matchId,
}: {
  winProb: WinProbabilityEstimate;
  pressure: PressureProfile;
  swings: MomentumInsight[];
  tps: TurningPoint[];
  summary: MatchSummaryBundle;
  team1: string;
  team2: string;
  matchId: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold tracking-tight text-zinc-100">Match intelligence</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <WinProbabilityChart
          matchId={matchId}
          estimate={winProb}
          team1={team1}
          team2={team2}
        />
        <PressureMeter profile={pressure} />
        <MomentumInsights items={swings} />
        <TurningPointsCard points={tps} />
        <MatchSummaryCard summary={summary} />
      </div>
    </section>
  );
}
