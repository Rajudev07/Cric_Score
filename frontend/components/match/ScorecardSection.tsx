"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import type { BattingRow, BowlingRow } from "@/lib/data/matches";
import ScorecardTable from "@/components/matches/ScorecardTable";
import TabEmptyState from "@/components/match/TabEmptyState";
import { cn } from "@/lib/utils";

type Mode = "batting" | "bowling";

export default function ScorecardSection({
  batting,
  bowling,
}: {
  batting: BattingRow[];
  bowling: BowlingRow[];
}) {
  const [mode, setMode] = useState<Mode>("batting");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        {(["batting", "bowling"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold capitalize transition-colors",
              mode === m ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {m}
          </button>
        ))}
      </div>
      {mode === "batting" ? (
        batting.length > 0 ? (
          <ScorecardTable variant="batting" rows={batting} />
        ) : (
          <TabEmptyState
            icon={Clock}
            text="Scorecard updates after the match"
            subtext="Live scores are updating above"
          />
        )
      ) : bowling.length > 0 ? (
        <ScorecardTable variant="bowling" rows={bowling} />
      ) : (
        <TabEmptyState
          icon={Clock}
          text="Scorecard updates after the match"
          subtext="Live scores are updating above"
        />
      )}
    </div>
  );
}
