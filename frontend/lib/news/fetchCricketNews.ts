export type NewsItem = {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
};

let cachedNews: NewsItem[] = [];

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function fetchCricketNews(limit = 10): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://www.espncricinfo.com/feeds/rss/cricket-news.xml",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      return cachedNews.slice(0, limit);
    }

    const xml = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "";
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
      const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";

      const cleanTitle = stripHtml(title);
      const cleanLink = stripHtml(link);
      const cleanDesc = stripHtml(desc);

      if (cleanTitle && cleanLink) {
        const snippet =
          cleanDesc.length > 150 ? `${cleanDesc.slice(0, 150)}...` : cleanDesc;
        items.push({
          title: cleanTitle,
          link: cleanLink,
          pubDate: pubDate ? new Date(pubDate) : new Date(),
          description: snippet,
        });
      }

      if (items.length >= limit) break;
    }

    if (items.length) {
      cachedNews = items;
    }

    return items;
  } catch (err) {
    console.error("[news] fetch failed", err);
    return cachedNews.slice(0, limit);
  }
}
