import type { SeriesPointsTable } from "@/lib/data/series";
import { cn } from "@/lib/utils";

export default function PointsTable({ series }: { series: SeriesPointsTable | null }) {
  if (!series?.rows.length) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-6 text-sm text-zinc-500">
        Points table not available for this series yet.
      </p>
    );
  }

  const qualify = series.qualifyCount ?? 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
      <table className="w-full min-w-[360px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/80">
            {["Team", "P", "W", "L", "NR", "NRR", "Pts"].map((h) => (
              <th
                key={h}
                className={cn(
                  "px-3 py-2 font-semibold text-zinc-400",
                  h !== "Team" && "text-right"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.rows.map((row, i) => (
            <tr
              key={row.team}
              className={cn(
                "border-b border-zinc-800/80 last:border-0",
                qualify > 0 && i < qualify && "border-l-2 border-l-emerald-500/70"
              )}
            >
              <td className="px-3 py-2 font-medium text-zinc-200">{row.team}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{row.played}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{row.won}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{row.lost}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{row.nr}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-400">{row.nrr}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold text-zinc-100">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
