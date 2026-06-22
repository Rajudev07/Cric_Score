import Link from "next/link";
import type { Match } from "@/lib/data/matches";

type TabId = "live" | "upcoming" | "completed";

interface EmptyStateProps {
  tab: TabId;
  upcoming?: Match[];
}

function formatLocalTime(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function countdownTo(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const diff = t - Date.now();
  if (diff <= 0) return "starting soon";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export default function EmptyState({ tab, upcoming = [] }: EmptyStateProps) {
  const next = upcoming[0];

  if (tab === "live") {
    const when = next ? formatLocalTime(next.startTimeIso) : null;
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-14 text-center">
        <p className="text-lg font-semibold text-zinc-200">No live matches right now</p>
        {next && when ? (
          <p className="mt-2 text-sm text-zinc-500">
            Next up: {next.team1} vs {next.team2} · {when}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Check the schedule for fixtures.</p>
        )}
        <Link href="/schedule" className="mt-4 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200">
          View schedule →
        </Link>
      </div>
    );
  }

  if (tab === "upcoming") {
    const cd = next ? countdownTo(next.startTimeIso) : null;
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-14 text-center">
        <p className="text-lg font-semibold text-zinc-200">No matches scheduled today</p>
        {next && cd ? (
          <p className="mt-2 text-sm text-zinc-500">
            Next fixture {cd}: {next.team1} vs {next.team2}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-14 text-center">
      <p className="text-lg font-semibold text-zinc-200">No recent results</p>
      <p className="mt-2 text-sm text-zinc-500">Completed games appear here after the feed refreshes.</p>
      <Link href="/schedule" className="mt-4 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200">
        Browse schedule →
      </Link>
    </div>
  );
}
