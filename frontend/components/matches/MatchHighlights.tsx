import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HighlightCard } from "@/lib/utils/highlights";
import { cn } from "@/lib/utils";

interface MatchHighlightsProps {
  highlights: HighlightCard[];
  isRefreshing?: boolean;
}

const toneRing: Record<HighlightCard["tone"], string> = {
  run: "ring-emerald-900/40 border-emerald-900/30",
  wicket: "ring-red-900/40 border-red-900/30",
  pressure: "ring-amber-900/40 border-amber-900/30",
  milestone: "ring-violet-900/40 border-violet-900/30",
};

export default function MatchHighlights({
  highlights,
  isRefreshing = false,
}: MatchHighlightsProps) {
  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900 ring-zinc-800 transition-opacity duration-300",
        isRefreshing && "opacity-85"
      )}
    >
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="text-lg text-zinc-100">Live highlights</CardTitle>
        <p className="text-xs font-normal text-zinc-500">
          Auto-detected from status & commentary
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
        {!highlights.length ? (
          <p className="col-span-full text-sm text-zinc-500">
            Highlights appear when milestones, wickets, or chase equations show
            up in the feed.
          </p>
        ) : (
          highlights.map((h) => (
            <div
              key={h.id}
              className={cn(
                "rounded-xl border bg-zinc-950/50 px-4 py-3 ring-1 transition-transform duration-300",
                toneRing[h.tone],
                "hover:-translate-y-0.5"
              )}
            >
              <p className="text-sm font-semibold text-zinc-100">{h.title}</p>
              {h.subtitle ? (
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-500">
                  {h.subtitle}
                </p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
