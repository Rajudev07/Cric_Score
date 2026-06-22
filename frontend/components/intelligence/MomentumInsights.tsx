import type { MomentumInsight } from "@/lib/intelligence/momentumAnalysis";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityRing: Record<MomentumInsight["severity"], string> = {
  low: "border-zinc-700 text-zinc-400",
  mid: "border-amber-800/60 text-amber-200/90",
  high: "border-red-800/60 text-red-200/90",
};

export default function MomentumInsights({ items }: { items: MomentumInsight[] }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/90 ring-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-zinc-100">
          Momentum swings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Not enough parsed ball-by-ball signal yet — insights appear as commentary fills in.
          </p>
        ) : (
          items.map((it, idx) => (
            <div
              key={`${it.kind}-${it.overLabel}-${idx}`}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 transition-colors hover:border-zinc-700"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] uppercase", severityRing[it.severity])}>
                  {it.severity}
                </Badge>
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {it.overLabel}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-100">{it.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{it.detail}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
