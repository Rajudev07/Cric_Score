import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MomentumSnapshot } from "@/lib/utils/momentum";
import { cn } from "@/lib/utils";

interface MomentumBarProps {
  momentum: MomentumSnapshot;
  isRefreshing?: boolean;
}

export default function MomentumBar({
  momentum,
  isRefreshing = false,
}: MomentumBarProps) {
  const pct = ((momentum.score + 100) / 200) * 100;
  const clamped = Math.max(6, Math.min(94, pct));

  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900 ring-zinc-800 transition-opacity duration-300",
        isRefreshing && "opacity-85"
      )}
    >
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="text-lg text-zinc-100">Momentum</CardTitle>
        <p className="text-xs font-normal text-zinc-500">{momentum.label}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="relative h-3 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-900/80 via-emerald-800/70 to-emerald-500/80 transition-[width] duration-500 ease-out"
            style={{ width: `${clamped}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-zinc-500/80"
            style={{ left: "50%" }}
            title="Neutral"
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
          <span>Bowling</span>
          <span>
            Pressure:{" "}
            <span className="font-semibold text-zinc-300">
              {momentum.battingPressure}
            </span>
          </span>
          <span>Batting</span>
        </div>
        {momentum.chaseDifficulty ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300">
            <span className="text-zinc-500">Chase: </span>
            {momentum.chaseDifficulty}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
