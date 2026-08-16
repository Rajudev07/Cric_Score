import type { Metadata } from "next";
import { NewsList } from "@/components/news/NewsList";
import { fetchCricketNews } from "@/lib/news/fetchCricketNews";
import { buildAppMetadata } from "@/lib/seo/buildMetadata";

export const metadata: Metadata = buildAppMetadata({
  title: "Cricket news",
  description: "Latest cricket headlines from ESPN Cricinfo on CricScore.",
  path: "/news",
});

export default async function NewsPage() {
  const news = await fetchCricketNews(15);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
              Cricket news
            </h1>
            <p className="text-zinc-400">
              Latest headlines from ESPN Cricinfo · refreshed hourly
            </p>
          </div>
          <NewsList items={news} />
        </div>
      </main>
    </div>
  );
}
