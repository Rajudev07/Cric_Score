"use client";

import useSWR from "swr";
import LiveBadge from "@/components/live/LiveBadge";
import OverBall from "@/components/matches/OverBall";
import type { BattingRow, BowlingRow, Match } from "@/lib/data/matches";
import {
  buildRecentOvers,
  parseBallEventsFromCommentary,
} from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";

interface MatchCardPreviewProps {
  matchId: string;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  status: string;
  position: "above" | "below";
  visible: boolean;
}

function useCachedLiveMatch(matchId: string): Match | undefined {
  const { data } = useSWR<Match[]>("cricket-live-current", null, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return data?.find((m) => m.id === matchId);
}

function battersAtCrease(batting: BattingRow[]): BattingRow[] {
  const active = batting.filter((b) => b.balls > 0);
  if (active.length >= 2) return active.slice(-2);
  return active;
}

function strikerIndex(batters: BattingRow[]): number {
  if (batters.length < 2) return 0;
  return batters[1].balls >= batters[0].balls ? 1 : 0;
}

function currentBowler(bowling: BowlingRow[]): BowlingRow | null {
  if (!bowling.length) return null;
  return bowling[bowling.length - 1] ?? null;
}

function formatBowlerLine(b: BowlingRow): string {
  return `${b.overs}-0-${b.runs}-${b.wickets}`;
}

export default function MatchCardPreview({
  matchId,
  team1,
  team2,
  score1,
  score2,
  status,
  position,
  visible,
}: MatchCardPreviewProps) {
  const cached = useCachedLiveMatch(matchId);
  const batters = cached?.batting?.length ? battersAtCrease(cached.batting) : [];
  const striker = strikerIndex(batters);
  const bowler = cached?.bowling?.length ? currentBowler(cached.bowling) : null;
  const events = cached?.commentary?.length
    ? parseBallEventsFromCommentary(cached.commentary)
    : [];
  const lastOverBalls = buildRecentOvers(events, 1)[0]?.balls.slice(-6) ?? [];

  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-auto absolute left-1/2 z-[100] w-[280px] -translate-x-1/2 rounded-xl border-[0.5px] border-[var(--color-border-tertiary)] bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:bg-zinc-900",
        position === "above" ? "bottom-full mb-2" : "top-full mt-2",
        visible
          ? "translate-y-0 opacity-100 transition-[opacity,transform] duration-150 ease-out"
          : "pointer-events-none translate-y-1 opacity-0 transition-[opacity,transform] duration-100 ease-in"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-foreground">
          {team1} vs {team2}
        </p>
        <LiveBadge />
      </div>

      {batters.length > 0 ? (
        <div className="space-y-1 border-b border-[var(--color-border-tertiary)] pb-2">
          {batters.map((b, i) => (
            <p
              key={`${b.batter}-${i}`}
              className={cn(
                "truncate pl-0 text-[11px] tabular-nums text-foreground",
                i === striker && "border-l-2 border-[var(--color-brand)] pl-2"
              )}
            >
              {b.batter} {b.runs}({b.balls}) {b.fours}x4 {b.sixes}x6
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-1 border-b border-[var(--color-border-tertiary)] pb-2 text-[11px] text-[var(--color-text-secondary)]">
          <p>
            {team1} {score1 || "—"}
          </p>
          <p>
            {team2} {score2 || "—"}
          </p>
          {status ? <p className="truncate">{status}</p> : null}
        </div>
      )}

      {lastOverBalls.length > 0 ? (
        <div className="mt-2">
          <p className="mb-1 text-left text-[10px] font-medium text-[var(--color-text-secondary)]">
            This over:
          </p>
          <div className="flex flex-wrap gap-1">
            {lastOverBalls.map((ball) => (
              <OverBall key={ball.ballDecimal} ball={ball} />
            ))}
          </div>
        </div>
      ) : null}

      {bowler ? (
        <p className="mt-2 truncate text-[11px] text-foreground">
          {bowler.bowler} {formatBowlerLine(bowler)}
        </p>
      ) : null}

      <p className="mt-2 text-[11px] text-[var(--color-text-secondary)]">
        Click for full scorecard →
      </p>
    </div>
  );
}
