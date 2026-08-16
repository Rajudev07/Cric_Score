import { fetchCricketNews } from "@/lib/news/fetchCricketNews";

export async function GET() {
  const news = await fetchCricketNews(15);
  const body = JSON.stringify({
    ok: true,
    data: news.map((n) => ({
      ...n,
      pubDate: n.pubDate.toISOString(),
    })),
  });

  const res = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600",
    },
  });

  return res;
}
