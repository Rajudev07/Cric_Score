import type { Metadata } from "next";
import RankingsClient from "@/components/rankings/RankingsClient";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";

export const metadata: Metadata = buildAppMetadata({
  title: "ICC Cricket Rankings | CricScore",
  description:
    "Latest ICC Test, ODI, and T20I rankings for batters, bowlers, and all-rounders.",
  path: "/rankings",
});

export default function RankingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <RankingsClient />
        </div>
      </main>
    </div>
  );
}
