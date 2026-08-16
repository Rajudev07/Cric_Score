import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecentOver } from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";
import OverBall from "./OverBall";

interface RecentOversProps {
  overs: RecentOver[];
  isRefreshing?: boolean;
}

export default function RecentOvers({
  overs,
  isRefreshing = false,
}: RecentOversProps) {
  if (!overs.length) return null;

  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900 ring-zinc-800 transition-opacity duration-300",
        isRefreshing && "opacity-85"
      )}
    >
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="text-lg text-zinc-100">Recent overs</CardTitle>
        <p className="text-xs font-normal text-zinc-500">
          Last {overs.length || 0} overs · ball-by-ball
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {overs.map((o) => (
            <div key={o.overNumber} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Over {o.overNumber}
              </p>
              <div className="flex flex-wrap justify-end gap-1.5">
                {o.balls.map((b, idx) => (
                  <OverBall
                    key={`${b.ballDecimal}-${idx}`}
                    ball={b}
                    isLatest={
                      overs[0]?.overNumber === o.overNumber &&
                      idx === o.balls.length - 1
                    }
                  />
                ))}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
