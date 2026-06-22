"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import MatchCard from "@/components/matches/MatchCard";
import MatchNotifyBell from "@/components/notifications/MatchNotifyBell";
import type { Match } from "@/lib/data/matches";
import { getMatchPhase } from "@/lib/utils/matchPriority";

type FormatFilter = "all" | "test" | "odi" | "t20i" | "women";

const FILTERS: { id: FormatFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "test", label: "Test" },
  { id: "odi", label: "ODI" },
  { id: "t20i", label: "T20I" },
  { id: "women", label: "Women's" },
];

async function fetchUpcoming(): Promise<Match[]> {
  const res = await fetch("/api/cricket/upcoming");
  const json = (await res.json()) as { ok?: boolean; data?: Match[] };
  return json.ok && Array.isArray(json.data) ? json.data : [];
}

function formatMatches(m: Match, filter: FormatFilter): boolean {
  if (filter === "all") return true;
  const mt = `${m.matchType} ${m.league} ${m.team1} ${m.team2}`.toLowerCase();
  if (filter === "women") return /women|womens|w\-/.test(mt);
  if (filter === "test") return /test/.test(mt);
  if (filter === "odi") return /odi|one.?day|50/.test(mt);
  if (filter === "t20i") return /t20|20-over|twenty20/.test(mt);
  return true;
}

function dateBucket(iso: string | null): "today" | "tomorrow" | "week" | "later" {
  if (!iso) return "later";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "later";
  const now = new Date();
  const d = new Date(t);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startTomorrow = startToday + 86_400_000;
  const startWeek = startToday + 7 * 86_400_000;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (day === startToday) return "today";
  if (day === startTomorrow) return "tomorrow";
  if (day < startWeek) return "week";
  return "later";
}

const BUCKET_LABELS = {
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  later: "Later",
} as const;

export default function ScheduleClient({ initial }: { initial: Match[] }) {
  const [filter, setFilter] = useState<FormatFilter>("all");
  const { data } = useSWR("schedule-upcoming", fetchUpcoming, {
    fallbackData: initial,
    refreshInterval: 60_000,
  });

  const upcoming = useMemo(() => {
    const list = (data ?? []).filter((m) => getMatchPhase(m) === "upcoming");
    return list.filter((m) => formatMatches(m, filter));
  }, [data, filter]);

  const grouped = useMemo(() => {
    const g: Record<keyof typeof BUCKET_LABELS, Match[]> = {
      today: [],
      tomorrow: [],
      week: [],
      later: [],
    };
    for (const m of upcoming) {
      g[dateBucket(m.startTimeIso)].push(m);
    }
    return g;
  }, [upcoming]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              filter === f.id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {(Object.keys(BUCKET_LABELS) as (keyof typeof BUCKET_LABELS)[]).map((key) => {
        const list = grouped[key];
        if (!list.length) return null;
        return (
          <section key={key} className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-100">{BUCKET_LABELS[key]}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {list.map((m) => (
                <div key={m.id} className="relative">
                  <div className="absolute right-3 top-3 z-10">
                    <MatchNotifyBell matchId={m.id} label={`${m.team1} vs ${m.team2}`} />
                  </div>
                  <MatchCard
                    id={m.id}
                    league={m.league}
                    team1={m.team1}
                    team2={m.team2}
                    score1={m.score1}
                    score2={m.score2}
                    status={m.status}
                    overs={m.overs}
                    matchType={m.matchType}
                    isLive={m.isLive}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {!upcoming.length ? (
        <p className="rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
          No upcoming matches for this filter.
        </p>
      ) : null}
    </div>
  );
}
