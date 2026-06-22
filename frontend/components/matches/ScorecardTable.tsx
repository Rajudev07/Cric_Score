import type { BattingRow, BowlingRow } from "@/lib/data/matches";

type ScorecardTableProps =
  | { variant: "batting"; rows: BattingRow[] }
  | { variant: "bowling"; rows: BowlingRow[] };

export default function ScorecardTable(props: ScorecardTableProps) {
  if (props.variant === "batting") {
    return (
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full min-w-[320px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/80">
              <th className="px-4 py-3 font-semibold tracking-tight text-zinc-300">
                Batter
              </th>
              <th className="px-3 py-3 text-right font-semibold tracking-tight text-zinc-300">
                Runs
              </th>
              <th className="px-3 py-3 text-right font-semibold tracking-tight text-zinc-300">
                Balls
              </th>
              <th className="px-3 py-3 text-right font-semibold tracking-tight text-zinc-300">
                4s
              </th>
              <th className="px-3 py-3 text-right font-semibold tracking-tight text-zinc-300">
                6s
              </th>
              <th className="px-4 py-3 text-right font-semibold tracking-tight text-zinc-300">
                SR
              </th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => (
              <tr
                key={row.batter}
                className="border-b border-zinc-800/80 last:border-0 hover:bg-zinc-800/40"
              >
                <td className="px-4 py-3 font-medium text-zinc-200">
                  {row.batter}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-100">
                  {row.runs}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                  {row.balls}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                  {row.fours}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                  {row.sixes}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                  {row.sr.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/80">
            <th className="px-4 py-3 font-semibold tracking-tight text-zinc-300">
              Bowler
            </th>
            <th className="px-3 py-3 text-right font-semibold tracking-tight text-zinc-300">
              Overs
            </th>
            <th className="px-3 py-3 text-right font-semibold tracking-tight text-zinc-300">
              Runs
            </th>
            <th className="px-3 py-3 text-right font-semibold tracking-tight text-zinc-300">
              Wkts
            </th>
            <th className="px-4 py-3 text-right font-semibold tracking-tight text-zinc-300">
              Econ
            </th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => (
            <tr
              key={row.bowler}
              className="border-b border-zinc-800/80 last:border-0 hover:bg-zinc-800/40"
            >
              <td className="px-4 py-3 font-medium text-zinc-200">
                {row.bowler}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                {row.overs}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-100">
                {row.runs}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-100">
                {row.wickets}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                {row.economy.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
