import type { WinProbabilityEstimate } from "@/lib/intelligence/winProbability";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WinProbabilityCard({
  estimate,
  team1,
  team2,
}: {
  estimate: WinProbabilityEstimate;
  team1: string;
  team2: string;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/90 ring-zinc-800">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-zinc-100">
          Win probability
        </CardTitle>
        <Badge variant="outline" className="border-zinc-700 text-[10px] uppercase text-zinc-400">
          {estimate.chaseActive ? "Chase model" : "Heuristic"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs leading-relaxed text-zinc-500">{estimate.note}</p>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-xs font-medium text-zinc-300">
              <span className="truncate pr-2">{team1}</span>
              <span className="tabular-nums text-zinc-400">{estimate.team1Pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-500 transition-[width] duration-700 ease-out"
                )}
                style={{ width: `${estimate.team1Pct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs font-medium text-zinc-300">
              <span className="truncate pr-2">{team2}</span>
              <span className="tabular-nums text-zinc-400">{estimate.team2Pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-800 to-emerald-500 transition-[width] duration-700 ease-out"
                style={{ width: `${estimate.team2Pct}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500">
          Confidence {Math.round(estimate.confidence * 100)}% · favored:{" "}
          {estimate.favored === "even"
            ? "dead heat"
            : estimate.favored === "team1"
              ? team1
              : team2}
        </p>
      </CardContent>
    </Card>
  );
}
