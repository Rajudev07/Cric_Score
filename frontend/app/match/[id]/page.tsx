import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LiveMatchDetailView from "@/components/live/LiveMatchDetailView";
import MatchViewTracker from "@/components/pwa/MatchViewTracker";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import MatchStructuredData from "@/components/seo/MatchStructuredData";
import MatchTeamHubLinks from "@/components/seo/MatchTeamHubLinks";
import { getMatchById } from "@/lib/api/cricapi";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const result = await getMatchById(decoded);
  if (!result.ok || !result.data) {
    return buildAppMetadata({
      title: "Match scorecard",
      description: "Live cricket scorecard, commentary, and match timeline on CricScore.",
      path: `/match/${encodeURIComponent(decoded)}`,
    });
  }
  const m = result.data;
  return buildAppMetadata({
    title: `${m.team1} vs ${m.team2} Live Score`,
    description: `${m.league} — ${m.status}. Live scorecard and updates on CricScore.`,
    path: `/match/${encodeURIComponent(decoded)}`,
    keywords: [
      m.team1,
      m.team2,
      m.league,
      m.matchType,
      "live cricket score",
      "CricScore",
    ].filter(Boolean) as string[],
  });
}

function FetchError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-10 text-center">
      <p className="text-lg font-semibold tracking-tight text-zinc-100">
        Match unavailable
      </p>
      <p className="mt-3 max-w-lg mx-auto text-sm leading-relaxed text-zinc-400">
        {message}
      </p>
    </div>
  );
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const result = await getMatchById(decoded);

  if (!result.ok) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <main className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <FetchError message={result.error} />
          </div>
        </main>
      </div>
    );
  }

  const match = result.data;

  if (!match) {
    notFound();
  }

  const matchPath = `/match/${encodeURIComponent(match.id)}`;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <BreadcrumbSchema
            jsonId="breadcrumb-match"
            items={[
              { name: "Home", path: "/" },
              { name: `${match.team1} vs ${match.team2}`, path: matchPath },
            ]}
          />
          <MatchStructuredData match={match} path={matchPath} jsonId="ld-sports-match" />
          <MatchTeamHubLinks team1={match.team1} team2={match.team2} />
          <MatchViewTracker matchId={match.id} />
          <LiveMatchDetailView initialMatch={match} />
        </div>
      </main>
    </div>
  );
}
