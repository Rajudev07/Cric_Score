"use client";

import type { BallEvent } from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";

function chipClass(kind: BallEvent["kind"]): string {
  switch (kind) {
    case "dot":
      return "bg-gray-100 text-gray-500";
    case "four":
      return "bg-blue-100 text-blue-700";
    case "six":
      return "bg-purple-100 text-purple-700";
    case "wicket":
      return "bg-red-100 text-red-700";
    case "wide":
    case "noball":
      return "bg-amber-100 text-amber-700";
  }
  return "border border-gray-300 bg-white text-gray-800";
}

interface BallTimelineProps {
  events: BallEvent[];
  maxOvers?: number;
}

export default function BallTimeline({ events, maxOvers = 5 }: BallTimelineProps) {
  if (!events.length) {
    return (
      <p className="py-4 text-sm text-zinc-500">
        Ball chips appear when commentary includes over-by-over lines.
      </p>
    );
  }

  const byOver = new Map<number, BallEvent[]>();
  for (const e of events) {
    const arr = byOver.get(e.overInt) ?? [];
    arr.push(e);
    byOver.set(e.overInt, arr);
  }
  for (const [, balls] of byOver) {
    balls.sort((a, b) => a.ballDecimal - b.ballDecimal);
  }
  const overKeys = [...byOver.keys()].sort((a, b) => a - b).slice(-maxOvers);

  const latestKey = events.length
    ? `${events[events.length - 1]!.ballDecimal}|${events[events.length - 1]!.display}`
    : "";

  return (
    <div className="space-y-4">
      {overKeys.map((overInt) => {
        const balls = byOver.get(overInt) ?? [];
        return (
          <div key={overInt} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Over {overInt}
            </p>
            <div className="flex flex-wrap justify-end gap-1.5">
              {balls.map((b) => {
                const key = `${b.ballDecimal}|${b.display}`;
                const isNew = key === latestKey;
                return (
                  <span
                    key={key}
                    title={b.rawText.slice(0, 200)}
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                      chipClass(b.kind),
                      isNew && "animate-ball-slide-in"
                    )}
                  >
                    {b.display}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
