"use client";

import { useMemo } from "react";
import HomeMatchTabs from "@/components/home/HomeMatchTabs";
import type { Match } from "@/lib/data/matches";
import {
  deriveTopPerformers,
  inferSeriesFormat,
  matchBelongsToSeries,
  partitionSeriesMatches,
  seriesSlugFromLeague,
} from "@/lib/utils/series";
import PointsTable from "@/components/series/PointsTable";
import type { SeriesPointsTable } from "@/lib/data/series";

interface SeriesMatchTabsProps {
  seriesSlug: string;
  matches: Match[];
  pointsTable: SeriesPointsTable | null;
}

export default function SeriesMatchTabs({
  seriesSlug,
  matches,
  pointsTable,
}: SeriesMatchTabsProps) {
  const seriesMatches = useMemo(
    () => matches.filter((m) => matchBelongsToSeries(m, seriesSlug)),
    [matches, seriesSlug]
  );
  const buckets = useMemo(() => partitionSeriesMatches(seriesMatches), [seriesMatches]);
  const format = inferSeriesFormat(seriesMatches);
  const performers = deriveTopPerformers([...buckets.live, ...buckets.completed]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold uppercase text-zinc-400 ring-1 ring-zinc-800">
          {format}
        </span>
        <span className="text-sm text-zinc-500">{seriesMatches.length} matches in feed</span>
      </div>

      {pointsTable ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-100">Points table</h2>
          <PointsTable series={pointsTable} />
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-100">Top run scorers</h2>
          {performers.runs.length ? (
            <ul className="space-y-2 text-sm">
              {performers.runs.map((p) => (
                <li key={p.name} className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                  <span className="text-zinc-200">{p.name}</span>
                  <span className="tabular-nums text-zinc-400">{p.value} runs</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No scorecard data in feed yet.</p>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-100">Top wicket takers</h2>
          {performers.wickets.length ? (
            <ul className="space-y-2 text-sm">
              {performers.wickets.map((p) => (
                <li key={p.name} className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                  <span className="text-zinc-200">{p.name}</span>
                  <span className="tabular-nums text-zinc-400">{p.value} wkts</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No bowling data in feed yet.</p>
          )}
        </div>
      </section>

      <HomeMatchTabs
        live={buckets.live}
        upcoming={buckets.upcoming}
        completed={buckets.completed}
      />
    </div>
  );
}
