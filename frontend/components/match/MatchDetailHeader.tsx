"use client";

import type { Match } from "@/lib/data/matches";
import LiveBadge from "@/components/live/LiveBadge";
import LiveScoreUpdater from "@/components/live/LiveScoreUpdater";
import ShareButton from "@/components/ui/ShareButton";
import { expandTeamShortCode } from "@/lib/utils/teamNameExpansion";
import { cn } from "@/lib/utils";

interface MatchDetailHeaderProps {
  match: Match;
  flash: { score1: boolean; score2: boolean; overs: boolean; status: boolean };
  isValidating?: boolean;
  children?: React.ReactNode;
}

export default function MatchDetailHeader({
  match,
  flash,
  isValidating,
  children,
}: MatchDetailHeaderProps) {
  const t1 = expandTeamShortCode(match.team1);
  const t2 = expandTeamShortCode(match.team2);

  const statusLine =
    match.score1 && match.score1 !== "—"
      ? `${t1} ${match.score1}${match.overs && match.overs !== "—" ? ` (${match.overs} ov)` : ""}`
      : match.status;

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-zinc-500">{match.league}</p>
          <h1 className="truncate text-lg font-medium text-zinc-100 sm:text-xl">
            {t1} <span className="font-medium text-zinc-500">vs</span> {t2}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {match.isLive ? <LiveBadge /> : null}
          <ShareButton matchTitle={`${t1} vs ${t2}`} statusLine={statusLine} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <span className="text-zinc-400">
          {t1}{" "}
          <LiveScoreUpdater flash={flash.score1} className="font-semibold tabular-nums text-zinc-100">
            {match.score1 || "—"}
          </LiveScoreUpdater>
        </span>
        <span className="text-zinc-400">
          {t2}{" "}
          <LiveScoreUpdater flash={flash.score2} className="font-semibold tabular-nums text-zinc-100">
            {match.score2 || "—"}
          </LiveScoreUpdater>
        </span>
        {match.overs && match.overs !== "—" ? (
          <span className="text-zinc-500">
            Ovs{" "}
            <LiveScoreUpdater flash={flash.overs} className="tabular-nums text-zinc-300">
              {match.overs}
            </LiveScoreUpdater>
          </span>
        ) : null}
      </div>
      <LiveScoreUpdater
        flash={flash.status}
        className={cn("mt-1 text-xs text-zinc-500", isValidating && "opacity-90")}
      >
        {match.status}
      </LiveScoreUpdater>
      {children}
    </div>
  );
}
