import type { Metadata } from "next";
import ScheduleClient from "@/components/schedule/ScheduleClient";
import TimezoneSelector from "@/components/schedule/TimezoneSelector";
import { getUpcomingMatches } from "@/lib/api/cricapi";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";

export const metadata: Metadata = buildAppMetadata({
  title: "Cricket schedule",
  description: "Upcoming international and franchise fixtures on CricScore.",
  path: "/schedule",
});

export default async function SchedulePage() {
  const res = await getUpcomingMatches();
  const initial = res.ok ? res.data : [];

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Schedule</h1>
              <p className="mt-2 text-zinc-400">Upcoming fixtures from the aggregated feed.</p>
            </div>
            <TimezoneSelector />
          </div>
          <ScheduleClient initial={initial} />
        </div>
      </main>
    </div>
  );
}
