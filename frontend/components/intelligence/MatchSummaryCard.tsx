import type { MatchSummaryBundle } from "@/lib/intelligence/matchSummary";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MatchSummaryCard({ summary }: { summary: MatchSummaryBundle }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/90 ring-zinc-800 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-zinc-100">
          Match summary
        </CardTitle>
        <p className="text-xs text-zinc-500">Heuristic narrative from live signals (no external LLM).</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-zinc-300">
        <p>{summary.liveLine}</p>
        <p className="text-zinc-400">{summary.inningsLine}</p>
        {summary.chaseLine ? <p className="text-zinc-400">{summary.chaseLine}</p> : null}
        <p className="border-t border-zinc-800 pt-3 text-xs text-zinc-400">{summary.recapLine}</p>
      </CardContent>
    </Card>
  );
}
