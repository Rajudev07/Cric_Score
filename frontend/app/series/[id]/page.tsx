import type { Metadata } from "next";
import SeriesMatchTabs from "@/components/series/SeriesMatchTabs";
import { getLiveMatches, getSeriesStandings, getUpcomingMatches } from "@/lib/api/cricapi";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";
import { matchBelongsToSeries } from "@/lib/utils/series";

interface SeriesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SeriesPageProps) {
  const { id } = await params;
  const slug = decodeURIComponent(id);
  return buildAppMetadata({
    title: "Series hub",
    description: `Live scores, fixtures, and standings for ${slug.replace(/-/g, " ")} on CricScore.`,
    path: `/series/${encodeURIComponent(slug)}`,
  });
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { id } = await params;
  const seriesSlug = decodeURIComponent(id);

  const [liveRes, upRes] = await Promise.all([getLiveMatches(), getUpcomingMatches()]);
  const merged = [
    ...(liveRes.ok ? liveRes.data : []),
    ...(upRes.ok ? upRes.data : []),
  ];
  const seriesMatches = merged.filter((m) => matchBelongsToSeries(m, seriesSlug));
  const seriesName = seriesMatches[0]?.league ?? seriesSlug.replace(/-/g, " ");

  const standingsRes = await getSeriesStandings(seriesName);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Series</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              {seriesName}
            </h1>
          </div>
          <SeriesMatchTabs
            seriesSlug={seriesSlug}
            matches={merged}
            pointsTable={standingsRes.ok ? standingsRes.data : null}
          />
        </div>
      </main>
    </div>
  );
}
