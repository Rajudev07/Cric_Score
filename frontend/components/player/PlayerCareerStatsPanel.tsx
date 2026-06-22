"use client";

import type { FormatStats, PlayerCareerStats } from "@/lib/api/cricapi";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "all" | "test" | "odi" | "t20";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "test", label: "Test" },
  { id: "odi", label: "ODI" },
  { id: "t20", label: "T20I" },
];

function pick(career: PlayerCareerStats, tab: Tab): FormatStats {
  if (tab === "test") return career.test;
  if (tab === "odi") return career.odi;
  if (tab === "t20") return career.t20;
  return career.all;
}

export default function PlayerCareerStatsPanel({ career }: { career: PlayerCareerStats }) {
  const [tab, setTab] = useState<Tab>("all");
  const s = pick(career, tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold",
              tab === t.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-500"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Matches" value={s.matches} />
        <Stat label="Runs" value={s.runs} />
        <Stat label="Avg" value={s.avg.toFixed(2)} />
        <Stat label="SR" value={s.sr.toFixed(1)} />
        <Stat label="Wickets" value={s.wickets} />
        <Stat label="Economy" value={s.economy.toFixed(2)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="text-lg font-bold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
