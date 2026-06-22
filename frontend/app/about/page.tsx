import type { Metadata } from "next";
import Link from "next/link";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";

export const metadata: Metadata = buildAppMetadata({
  title: "About CricScore",
  description: "Learn about CricScore — free live cricket scores without ads or paywalls.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="flex-1 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-[600px] space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">About CricScore</h1>
        <p className="text-base leading-relaxed text-zinc-400">
          CricScore is a free, open cricket score tracker built for fans who want live scores
          without ads or paywalls.
        </p>
        <p className="text-base leading-relaxed text-zinc-400">
          Data is sourced from CricketData.org (free tier) and publicly available web sources.
          CricScore is not affiliated with the BCCI, ICC, Cricbuzz, or any cricket board.
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link href="/schedule" className="font-medium text-[var(--color-brand)] hover:underline">
            Schedule
          </Link>
          <Link href="/" className="font-medium text-[var(--color-brand)] hover:underline">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
