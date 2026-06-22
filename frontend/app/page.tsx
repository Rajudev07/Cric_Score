import type { Metadata } from "next";
import LiveMatchesClient from "@/components/live/LiveMatchesClient";
import { getLiveMatches, getUpcomingMatches } from "@/lib/api/cricapi";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear();
  return buildAppMetadata({
    title: `IPL ${year} Live Scores`,
    description: `IPL ${year} live scores, fixtures, commentary-rich match pages, and prioritized feeds on CricScore.`,
    path: "/",
  });
}
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-10 text-center">
      <p className="text-lg font-semibold tracking-tight text-zinc-100">
        Unable to load matches
      </p>
      <p className="mt-3 max-w-lg mx-auto text-sm leading-relaxed text-zinc-400">
        {message}
      </p>
    </div>
  );
}

function PartialWarning({ message }: { message: string }) {
  return (
    <div className="mb-8 rounded-lg border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95">
      {message}
    </div>
  );
}

export default async function Home() {
  const [liveRes, upcomingRes] = await Promise.all([
    getLiveMatches(),
    getUpcomingMatches(),
  ]);

  if (!liveRes.ok && !upcomingRes.ok) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <main className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <ErrorBanner
              message={`${liveRes.error} · ${upcomingRes.error}`}
            />
          </div>
        </main>
      </div>
    );
  }

  const currentData = liveRes.ok ? liveRes.data : [];
  const fixtureData = upcomingRes.ok ? upcomingRes.data : [];

  const partialNote =
    !liveRes.ok && upcomingRes.ok
      ? `Live feed unavailable (${liveRes.error}). Showing fixtures where possible.`
      : liveRes.ok && !upcomingRes.ok
        ? `Fixture list unavailable (${upcomingRes.error}). Showing live feed only.`
        : null;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              CricScore
            </h1>
            <p className="max-w-2xl text-zinc-400">
              Major tournaments first — live scores refresh automatically while
              games are in progress.
            </p>
          </div>

          {partialNote ? <PartialWarning message={partialNote} /> : null}

          <LiveMatchesClient
            fixtureMatches={fixtureData}
            fallbackCurrent={currentData}
          />
        </div>
      </main>
    </div>
  );
}
