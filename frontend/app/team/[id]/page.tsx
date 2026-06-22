import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/matches/MatchCard";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import FavoriteTeamButton from "@/components/user/FavoriteTeamButton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLiveMatches, getUpcomingMatches } from "@/lib/api/cricapi";
import type { Match } from "@/lib/data/matches";
import { getTeamById, teamSquads } from "@/lib/data/searchCatalog";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";
import { findPlayerSlugByName } from "@/lib/seo/indexing";
import { partitionTeamMatches } from "@/lib/utils/teamMatches";
import { teamLastTenForm } from "@/lib/utils/teamForm";
import TeamFormDots from "@/components/team/TeamFormDots";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  const team = getTeamById(decodeURIComponent(id));
  if (!team) {
    return buildAppMetadata({
      title: "Team hub",
      description: "Team fixtures, live hub, and squad view on CricScore.",
      path: `/team/${encodeURIComponent(id)}`,
    });
  }
  return buildAppMetadata({
    title: `${team.name} · Live hub & fixtures`,
    description: `Live, upcoming, and recent matches for ${team.name} (${team.shortName}) — personalized feeds on CricScore.`,
    path: `/team/${encodeURIComponent(id)}`,
  });
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const team = getTeamById(decodeURIComponent(id));
  if (!team) notFound();

  const [liveRes, upRes] = await Promise.all([
    getLiveMatches(),
    getUpcomingMatches(),
  ]);

  const merged: Match[] = [];
  if (liveRes.ok) merged.push(...liveRes.data);
  if (upRes.ok) merged.push(...upRes.data);
  const byId = new Map<string, (typeof merged)[0]>();
  for (const m of merged) byId.set(m.id, m);
  const unique = [...byId.values()];

  const { live, upcoming, completed } = partitionTeamMatches(team, unique);
  const form = teamLastTenForm(team, completed);
  const squad = teamSquads[team.id] ?? [];
  const teamPath = `/team/${encodeURIComponent(team.id)}`;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10">
          <BreadcrumbSchema
            jsonId="breadcrumb-team"
            items={[
              { name: "Home", path: "/" },
              { name: "Teams", path: "/" },
              { name: team.name, path: teamPath },
            ]}
          />
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-950 text-2xl font-black tracking-tight text-zinc-100 ring-1 ring-zinc-700/80">
              {team.shortName.slice(0, 3)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Team hub
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
                {team.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-zinc-300">
                  {team.shortName}
                </Badge>
                <FavoriteTeamButton teamId={team.id} />
              </div>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Live</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-zinc-50">
                  {live.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-zinc-50">
                  {upcoming.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-zinc-50">
                  {completed.length}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Last 10 results
            </h2>
            <TeamFormDots results={form} />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Live & recent results
            </h2>
            {live.length === 0 && completed.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500">
                No matches in the current feed for this team.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {[...live, ...completed.slice(0, 6)].map((m) => (
                  <MatchCard
                    key={m.id}
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
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500">
                No upcoming fixtures loaded for this team in the current window.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {upcoming.map((m) => (
                  <MatchCard
                    key={m.id}
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
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Squad
            </h2>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="grid gap-2 pt-6 sm:grid-cols-2">
                {squad.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Squad list not curated for this franchise yet.
                  </p>
                ) : (
                  squad.map((name) => {
                    const slug = findPlayerSlugByName(name);
                    return (
                      <div
                        key={name}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm font-medium text-zinc-200"
                      >
                        {slug ? (
                          <Link className="text-violet-300 hover:text-violet-200" href={`/player/${slug}`}>
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              Performance snapshot
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-200">
                    Form context
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-zinc-400">
                  Feed-driven cards above reflect what the public API exposes for
                  this team right now. Deeper analytics can plug in once series
                  endpoints are enabled.
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-200">
                    Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-zinc-400">
                  International and franchise priority matches surface first on
                  the home feed; use search to jump between teams and players.
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
