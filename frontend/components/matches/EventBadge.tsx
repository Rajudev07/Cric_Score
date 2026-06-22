import type { CommentaryEventType } from "@/lib/utils/commentaryClassifier";
import { cn } from "@/lib/utils";

interface EventBadgeProps {
  type: CommentaryEventType;
  compact?: boolean;
}

const styles: Record<CommentaryEventType, string> = {
  wicket: "border-red-900/60 bg-red-950/55 text-red-200",
  four: "border-emerald-800/60 bg-emerald-950/50 text-emerald-200",
  six: "border-violet-800/60 bg-violet-950/50 text-violet-200",
  milestone: "border-amber-800/60 bg-amber-950/45 text-amber-100",
  partnership: "border-sky-800/50 bg-sky-950/40 text-sky-100",
  review: "border-orange-800/50 bg-orange-950/40 text-orange-100",
  dropped_catch: "border-rose-800/50 bg-rose-950/35 text-rose-100",
  dot: "border-zinc-800 bg-zinc-950/80 text-zinc-500",
  extras: "border-amber-900/50 bg-amber-950/35 text-amber-100",
  runs: "border-zinc-700 bg-zinc-900/80 text-zinc-200",
  neutral: "border-zinc-800 bg-zinc-900/70 text-zinc-500",
};

const labels: Record<CommentaryEventType, string> = {
  wicket: "W",
  four: "4",
  six: "6",
  milestone: "★",
  partnership: "PT",
  review: "DRS",
  dropped_catch: "Dr",
  dot: "·",
  extras: "ex",
  runs: "Rg",
  neutral: "•",
};

export default function EventBadge({ type, compact }: EventBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        compact ? "min-w-[1.25rem]" : "min-w-[1.75rem]",
        styles[type]
      )}
    >
      {labels[type]}
    </span>
  );
}
