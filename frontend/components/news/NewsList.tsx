import type { NewsItem } from "@/lib/news/fetchCricketNews";
import { cn } from "@/lib/utils";

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NewsList({
  items,
  className,
}: {
  items: NewsItem[];
  className?: string;
}) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-6 text-sm text-zinc-500">
        No recent news
      </p>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item.link}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-snug text-zinc-100">
                {item.title}
              </h3>
              <time
                className="shrink-0 text-xs tabular-nums text-zinc-500"
                dateTime={item.pubDate.toISOString()}
              >
                {formatRelativeTime(item.pubDate)}
              </time>
            </div>
            {item.description ? (
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {item.description}
              </p>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
