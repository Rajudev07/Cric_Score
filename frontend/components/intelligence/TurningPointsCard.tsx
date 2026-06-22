import type { TurningPoint } from "@/lib/intelligence/turningPoints";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TurningPointsCard({ points }: { points: TurningPoint[] }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/90 ring-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-zinc-100">
          Turning points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {points.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No high-impact moments inferred from the latest overs window.
          </p>
        ) : (
          points.map((p, idx) => (
            <div
              key={`${p.tag}-${p.overLabel}-${idx}`}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase text-zinc-300">
                  {p.tag.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs font-semibold tabular-nums text-amber-200/90">
                  impact {p.impact}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-100">{p.title}</p>
              <p className="text-[11px] text-zinc-500">{p.overLabel}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{p.explanation}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
