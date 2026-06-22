import type { CommentaryEventType } from "@/lib/utils/commentaryClassifier";
import { cn } from "@/lib/utils";
import EventBadge from "./EventBadge";

export interface BallTimelineRow {
  id: string;
  ovLabel: string;
  type: CommentaryEventType;
  shortText: string;
  fullText: string;
}

interface TimelineEventProps {
  row: BallTimelineRow;
  isLatest?: boolean;
}

export default function TimelineEvent({ row, isLatest }: TimelineEventProps) {
  return (
    <div
      className={cn(
        "flex gap-3 border-l-2 py-2 pl-3 transition-colors duration-300",
        isLatest ? "border-emerald-600/70 bg-emerald-950/10" : "border-zinc-800",
        "hover:border-zinc-600 hover:bg-zinc-900/40"
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-start gap-1">
        <span className="font-mono text-xs font-semibold tabular-nums text-zinc-300">
          {row.ovLabel}
        </span>
        <EventBadge type={row.type} compact />
      </div>
      <p
        className="min-w-0 flex-1 text-sm leading-snug text-zinc-400"
        title={row.fullText}
      >
        {row.shortText}
      </p>
    </div>
  );
}
