import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PartnershipInfo } from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";

interface PartnershipsCardProps {
  partnerships: PartnershipInfo[];
  isRefreshing?: boolean;
}

export default function PartnershipsCard({
  partnerships,
  isRefreshing = false,
}: PartnershipsCardProps) {
  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900 ring-zinc-800 transition-opacity duration-300",
        isRefreshing && "opacity-85"
      )}
    >
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="text-lg text-zinc-100">Partnerships</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!partnerships.length ? (
          <p className="text-sm text-zinc-500">
            Partnership lines appear when commentary or scorecard lists pairs.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[320px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80">
                  <th className="px-3 py-2 font-semibold text-zinc-400">Label</th>
                  <th className="px-3 py-2 font-semibold text-zinc-400">Batters</th>
                  <th className="px-3 py-2 text-right font-semibold text-zinc-400">
                    Runs
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-zinc-400">
                    Balls
                  </th>
                </tr>
              </thead>
              <tbody>
                {partnerships.map((p, i) => (
                  <tr
                    key={`${p.label}-${i}`}
                    className="border-b border-zinc-800/80 last:border-0"
                  >
                    <td className="px-3 py-2 text-zinc-300">{p.label}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-zinc-400">
                      {p.batters}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-100">
                      {p.runs}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                      {p.balls}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
