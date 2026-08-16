import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FallOfWicketInfo } from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";

interface FallOfWicketsProps {
  wickets: FallOfWicketInfo[];
  isRefreshing?: boolean;
}

export default function FallOfWickets({
  wickets,
  isRefreshing = false,
}: FallOfWicketsProps) {
  if (!wickets.length) return null;

  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900 ring-zinc-800 transition-opacity duration-300",
        isRefreshing && "opacity-85"
      )}
    >
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="text-lg text-zinc-100">Fall of wickets</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[360px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80">
                  <th className="px-3 py-2 font-semibold text-zinc-400">#</th>
                  <th className="px-3 py-2 font-semibold text-zinc-400">Score</th>
                  <th className="px-3 py-2 font-semibold text-zinc-400">Over</th>
                  <th className="px-3 py-2 font-semibold text-zinc-400">Detail</th>
                </tr>
              </thead>
              <tbody>
                {wickets.map((w, idx) => (
                  <tr
                    key={`fow-${idx}-${w.wicket}-${w.score}`}
                    className="border-b border-zinc-800/80 last:border-0"
                  >
                    <td className="px-3 py-2 tabular-nums text-zinc-300">
                      {w.wicket}
                    </td>
                    <td className="px-3 py-2 font-medium tabular-nums text-zinc-100">
                      {w.score}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-zinc-400">
                      {w.over}
                    </td>
                    <td className="max-w-[280px] px-3 py-2 text-zinc-400">
                      {w.batter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </CardContent>
    </Card>
  );
}
