import type { CommentaryItem } from "@/lib/data/matches";

interface CommentaryCardProps {
  item: CommentaryItem;
}

export default function CommentaryCard({ item }: CommentaryCardProps) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      <p className="text-sm leading-relaxed text-zinc-300">
        <span className="font-semibold tabular-nums text-zinc-400">
          {item.over}
        </span>
        <span className="text-zinc-600"> — </span>
        {item.text}
      </p>
    </article>
  );
}
