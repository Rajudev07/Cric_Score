"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PartnershipInfo } from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";

interface PartnershipChartProps {
  partnerships: PartnershipInfo[];
  isRefreshing?: boolean;
}

export default function PartnershipChart({
  partnerships,
  isRefreshing = false,
}: PartnershipChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [partnerships]);

  const totalRuns = partnerships.reduce((s, p) => s + Math.max(0, p.runs), 0) || 1;

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
      <CardContent className="space-y-4 pt-4">
        {!partnerships.length ? (
          <p className="text-sm text-zinc-500">
            Partnership lines appear when commentary or scorecard lists pairs.
          </p>
        ) : (
          partnerships.map((p, i) => {
            const pct = Math.min(100, (p.runs / totalRuns) * 100);
            const label =
              p.batters && p.batters !== "—"
                ? `${p.batters} — ${p.runs} (${p.balls}b)`
                : `${p.label} — ${p.runs} (${p.balls}b)`;
            const width = mounted ? pct : 0;
            const shade = Math.min(90, 40 + i * 12);
            return (
              <div key={`${p.label}-${i}`} className="space-y-1">
                <p className="truncate text-xs text-zinc-400">{label}</p>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-500/80 transition-[width] duration-[600ms] ease-out"
                    style={{
                      width: `${width}%`,
                      opacity: 0.35 + shade / 200,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
