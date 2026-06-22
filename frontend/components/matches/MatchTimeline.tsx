import type { CommentaryItem } from "@/lib/data/matches";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { classifyCommentaryText } from "@/lib/utils/commentaryClassifier";
import { cn } from "@/lib/utils";
import TimelineEvent, { type BallTimelineRow } from "./TimelineEvent";

function parseOvSortKey(ov: string): number {
  const m = ov.trim().match(/^(\d+)\.(\d+)/);
  if (!m) return 0;
  return parseFloat(`${m[1]}.${m[2]}`);
}

function buildTimelineRows(
  commentary: CommentaryItem[],
  max = 42
): BallTimelineRow[] {
  const rows: BallTimelineRow[] = [];
  commentary.forEach((c, idx) => {
    const cl = classifyCommentaryText(c.text);
    const ovTrim = c.over.trim();
    const ovFromField = /^\d+\.\d+/.test(ovTrim) ? ovTrim : "";
    const ovFromText = c.text.match(/^\s*(\d+\.\d+)/)?.[1] ?? "";
    const ovLabel = ovFromField || ovFromText;
    if (!ovLabel && cl.type === "neutral") return;
    rows.push({
      id: `tl-${idx}-${ovLabel || "n"}`,
      ovLabel: ovLabel || "—",
      type: cl.type,
      shortText: c.text.replace(/\s+/g, " ").slice(0, 96),
      fullText: c.text,
    });
  });
  rows.sort((a, b) => parseOvSortKey(a.ovLabel) - parseOvSortKey(b.ovLabel));
  return rows.slice(-max);
}

interface MatchTimelineProps {
  commentary: CommentaryItem[];
  isRefreshing?: boolean;
}

export default function MatchTimeline({
  commentary,
  isRefreshing = false,
}: MatchTimelineProps) {
  const rows = buildTimelineRows(commentary, 48);
  const lastId = rows.length ? rows[rows.length - 1]?.id : "";

  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900 ring-zinc-800 transition-opacity duration-300",
        isRefreshing && "opacity-85"
      )}
    >
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="text-lg text-zinc-100">Ball timeline</CardTitle>
        <p className="text-xs font-normal text-zinc-500">
          Chronological · last {rows.length} events
        </p>
      </CardHeader>
      <CardContent className="max-h-[28rem] overflow-y-auto pt-2 pr-1">
        {!rows.length ? (
          <p className="py-6 text-sm text-zinc-500">
            Timeline fills when classified commentary lines are available.
          </p>
        ) : (
          <div className="space-y-0.5">
            {rows.map((row) => (
              <TimelineEvent
                key={row.id}
                row={row}
                isLatest={row.id === lastId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
