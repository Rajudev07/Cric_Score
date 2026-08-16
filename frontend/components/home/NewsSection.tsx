"use client";

import useSWR from "swr";
import Link from "next/link";
import type { NewsItem } from "@/lib/news/fetchCricketNews";
import { NewsList } from "@/components/news/NewsList";

type NewsApiResponse = {
  ok: boolean;
  data?: Array<Omit<NewsItem, "pubDate"> & { pubDate: string }>;
};

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch("/api/news");
  const json = (await res.json()) as NewsApiResponse;
  if (!json.ok || !Array.isArray(json.data)) return [];
  return json.data.map((row) => ({
    ...row,
    pubDate: new Date(row.pubDate),
  }));
}

export default function NewsSection() {
  const { data } = useSWR("news-feed", fetchNews, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });

  const topFive = (data ?? []).slice(0, 5);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Cricket news
          </h2>
          <p className="text-sm text-zinc-500">Headlines from ESPN Cricinfo</p>
        </div>
        <Link
          href="/news"
          className="text-xs font-medium text-[var(--color-brand)] hover:underline"
        >
          View all
        </Link>
      </div>
      <NewsList items={topFive} />
    </section>
  );
}
