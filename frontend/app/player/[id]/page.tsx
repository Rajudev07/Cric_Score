import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import PlayerCareerStatsPanel from "@/components/player/PlayerCareerStatsPanel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLiveMatches, getPlayerProfile, getUpcomingMatches } from "@/lib/api/cricapi";
import {
  getPlayerCatalogById,
  getPlayerCatalogByPid,
} from "@/lib/data/searchCatalog";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";
import { resolveTeamHubSlugFromLabel } from "@/lib/seo/indexing";
import { findPlayerRecentMatches } from "@/lib/utils/playerMatches";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const rawId = decodeURIComponent((await params).id);
  const isNumericId = /^\d+$/.test(rawId.trim());
  const catalogBySlug = getPlayerCatalogById(rawId);
  const catalogByPid = isNumericId
    ? getPlayerCatalogByPid(rawId.trim())
    : undefined;
  const catalog = catalogBySlug ?? catalogByPid;

  const apiRes = isNumericId ? await getPlayerProfile(rawId.trim()) : null;
  const api = apiRes?.ok ? apiRes.data : null;

  const name = api?.name ?? catalog?.name ?? "Player";
  const path = `/player/${encodeURIComponent(rawId)}`;

  if (!catalog && !api) {
    return buildAppMetadata({
      title: "Player profile",
      description: "Player stats, role, and career snapshot on CricScore.",
      path,
    });
  }

  return buildAppMetadata({
    title: `${name} · Player profile`,
    description: `${name} — ${api?.role ?? catalog?.role ?? "cricketer"} · ${catalog?.team ?? api?.country ?? "CricScore player hub"}.`,
    path,
  });
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const rawId = decodeURIComponent((await params).id);
  const isNumericId = /^\d+$/.test(rawId.trim());

  const catalogBySlug = getPlayerCatalogById(rawId);
  const catalogByPid = isNumericId
    ? getPlayerCatalogByPid(rawId.trim())
    : undefined;
  const catalog = catalogBySlug ?? catalogByPid;

  const apiRes = isNumericId ? await getPlayerProfile(rawId.trim()) : null;
  const api = apiRes?.ok ? apiRes.data : null;

  if (!catalog && !api) {
    notFound();
  }

  const displayName = api?.name ?? catalog?.name ?? "Player";
  const role = api?.role ?? catalog?.role ?? "—";
  const team = catalog?.team ?? api?.country ?? "—";
  const playerPath = `/player/${encodeURIComponent(rawId)}`;
  const franchiseSlug = resolveTeamHubSlugFromLabel(team);

  const [liveRes, upRes] = await Promise.all([getLiveMatches(), getUpcomingMatches()]);
  const feed = [
    ...(liveRes.ok ? liveRes.data : []),
    ...(upRes.ok ? upRes.data : []),
  ];
  const recent = findPlayerRecentMatches(displayName, feed, 5);
  const career = api?.career ?? {
    all: { matches: 0, runs: 0, avg: 0, sr: 0, wickets: 0, economy: 0 },
    test: { matches: 0, runs: 0, avg: 0, sr: 0, wickets: 0, economy: 0 },
    odi: { matches: 0, runs: 0, avg: 0, sr: 0, wickets: 0, economy: 0 },
    t20: { matches: 0, runs: 0, avg: 0, sr: 0, wickets: 0, economy: 0 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10">
          <BreadcrumbSchema
            jsonId="breadcrumb-player"
            items={[
              { name: "Home", path: "/" },
              { name: displayName, path: playerPath },
            ]}
          />
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-gradient-to-br from-violet-950/80 to-zinc-950 text-2xl font-black text-zinc-100 ring-1 ring-zinc-700/80">
              {displayName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Player profile
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
                {displayName}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{role}</Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  {team}
                </Badge>
              </div>
              {franchiseSlug ? (
                <p className="text-sm">
                  <Link
                    href={`/team/${encodeURIComponent(franchiseSlug)}`}
                    className="font-semibold text-violet-300 hover:text-violet-200"
                  >
                    Open franchise hub →
                  </Link>
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Batting avg" value={catalog?.battingAvg ?? "—"} />
            <StatCard label="Strike rate" value={catalog?.strikeRate ?? "—"} />
            <StatCard label="Economy" value={catalog?.economy ?? "—"} />
            <StatCard label="Wickets (intl.)" value={catalog?.wickets ?? "—"} />
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-100">Career stats</h2>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="pt-6">
                <PlayerCareerStatsPanel career={career} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-base text-zinc-200">
                  Career summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-zinc-400">
                <p>
                  {catalog?.bio ??
                    api?.statsSummary ??
                    "Profile text will populate when the player API returns biography data for this id."}
                </p>
                {api?.battingStyle ? (
                  <p>
                    <span className="font-medium text-zinc-300">Batting: </span>
                    {api.battingStyle}
                  </p>
                ) : null}
                {api?.bowlingStyle ? (
                  <p>
                    <span className="font-medium text-zinc-300">Bowling: </span>
                    {api.bowlingStyle}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-base text-zinc-200">
                  Recent performances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {recent.length ? (
                  recent.map((r) => (
                    <Link
                      key={r.matchId}
                      href={`/match/${r.matchId}`}
                      className="block rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 hover:border-zinc-600"
                    >
                      <p className="font-medium text-zinc-200">
                        vs {r.opponent}{" "}
                        <span className="text-zinc-500">· {r.phase}</span>
                      </p>
                      <p className="text-zinc-400">{r.summary}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-zinc-500">
                    No recent innings in the current live/upcoming feed.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums text-zinc-50">{value}</p>
      </CardContent>
    </Card>
  );
}
