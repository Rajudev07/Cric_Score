"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ICC_RANKINGS_UPDATED_AT,
  iccRankings,
  type IccCategory,
  type IccFormat,
} from "@/lib/data/iccRankings";
import { resolvePlayerHref } from "@/lib/utils/playerHref";
import { teamFlagEmoji } from "@/lib/utils/teamFlags";
import { cn } from "@/lib/utils";

const FORMATS: { id: IccFormat; label: string }[] = [
  { id: "test", label: "Test" },
  { id: "odi", label: "ODI" },
  { id: "t20i", label: "T20I" },
];

const CATEGORIES: { id: IccCategory; label: string }[] = [
  { id: "batting", label: "Batting" },
  { id: "bowling", label: "Bowling" },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            value === opt.id
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function RankingsClient() {
  const [format, setFormat] = useState<IccFormat>("test");
  const [category, setCategory] = useState<IccCategory>("batting");

  const rows = useMemo(
    () => iccRankings[format][category],
    [format, category]
  );

  const updatedLabel = useMemo(() => {
    const d = new Date(ICC_RANKINGS_UPDATED_AT);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          ICC Rankings
        </h1>
        <p className="text-zinc-400">
          Updated weekly from official ICC data · Last updated {updatedLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Segmented options={FORMATS} value={format} onChange={setFormat} />
        <Segmented options={CATEGORIES} value={category} onChange={setCategory} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ring-zinc-800">
        <div className="hidden border-b border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid sm:grid-cols-[3rem_1fr_1fr_5rem] sm:gap-4">
          <span>Rank</span>
          <span>Player</span>
          <span>Team</span>
          <span className="text-right">Rating</span>
        </div>
        <ul className="divide-y divide-zinc-800">
          {rows.map((row) => {
            const href = resolvePlayerHref(row.player);
            const inner = (
              <>
                <span
                  className="text-sm font-bold tabular-nums text-[var(--color-brand)]"
                >
                  {row.rank}
                </span>
                <span className="min-w-0 font-medium text-zinc-100">
                  {row.player}
                </span>
                <span className="text-sm text-zinc-400 sm:justify-self-start">
                  <span className="mr-1.5" aria-hidden>
                    {teamFlagEmoji(row.team)}
                  </span>
                  {row.team}
                </span>
                <span
                  className="text-right text-sm font-semibold tabular-nums text-zinc-200"
                >
                  {row.rating}
                </span>
              </>
            );

            const rowClass =
              "grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-zinc-950/70 sm:grid-cols-[3rem_1fr_1fr_5rem] sm:gap-4";

            if (href) {
              return (
                <li key={`${row.rank}-${row.player}`}>
                  <Link href={href} className={cn(rowClass, "block")}>
                    {inner}
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={`${row.rank}-${row.player}`}
                className={rowClass}
              >
                {inner}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
