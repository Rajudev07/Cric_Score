import type { BallEvent } from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";

interface OverBallProps {
  ball: BallEvent;
  isLatest?: boolean;
}

export default function OverBall({ ball, isLatest }: OverBallProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
        ball.kind === "wicket" && "bg-red-100 text-red-700",
        ball.kind === "four" && "bg-blue-100 text-blue-700",
        ball.kind === "six" && "bg-purple-100 text-purple-700",
        ball.kind === "dot" && "bg-gray-100 text-gray-500",
        (ball.kind === "wide" || ball.kind === "noball") &&
          "bg-amber-100 text-amber-700",
        ball.kind === "runs" && "border border-gray-300 bg-white text-gray-800",
        ball.kind === "unknown" && "border border-gray-300 bg-white text-gray-800",
        (ball.kind === "bye" || ball.kind === "legbye") &&
          "bg-amber-100 text-amber-700",
        isLatest && "animate-ball-slide-in"
      )}
      title={ball.rawText.slice(0, 220)}
    >
      {ball.display}
    </span>
  );
}
