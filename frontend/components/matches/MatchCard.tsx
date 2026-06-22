import Link from "next/link";
import LiveBadge from "@/components/live/LiveBadge";
import LiveScoreUpdater from "@/components/live/LiveScoreUpdater";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ScoreFlash } from "@/lib/types/live";
import { cn } from "@/lib/utils";

export interface MatchCardProps {
  id: string;
  league: string;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  status: string;
  overs?: string;
  matchType?: string;
  isLive?: boolean;
  featured?: boolean;
  /** Personalized favorite — subtle highlight + optional badge */
  isFavorite?: boolean;
  scoreFlash?: ScoreFlash;
  /** Last commentary line for live matches */
  lastBall?: string | null;
}

function formatMatchType(mt: string): string {
  const s = mt.trim();
  if (!s) return "";
  return s.length <= 12 ? s.toUpperCase() : s.slice(0, 12).toUpperCase() + "…";
}

export default function MatchCard({
  id,
  league,
  team1,
  team2,
  score1,
  score2,
  status,
  overs,
  matchType,
  isLive = false,
  featured = false,
  isFavorite = false,
  scoreFlash,
  lastBall,
}: MatchCardProps) {
  const typeLabel = matchType ? formatMatchType(matchType) : "";
  const isIplLeague = /\bipl\b|indian premier league/i.test(league);

  return (
    <Link
      href={`/match/${id}`}
      className={cn(
        "group block cursor-pointer rounded-xl outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        featured &&
          "relative before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:ring-2 before:ring-amber-500/45 before:ring-offset-2 before:ring-offset-black",
        isFavorite &&
          !featured &&
          "relative before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:ring-1 before:ring-emerald-500/35 before:ring-offset-2 before:ring-offset-black"
      )}
    >
      <Card
        className={cn(
          "h-full border-zinc-800 bg-zinc-900 ring-zinc-800 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-zinc-600 group-hover:shadow-xl group-hover:shadow-black/60",
          featured && "border-zinc-700 bg-zinc-900/95",
          isFavorite && !featured && "border-emerald-900/40 bg-emerald-950/10"
        )}
      >
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-sm font-semibold leading-snug tracking-tight text-zinc-200">
              {league}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {typeLabel ? (
                <span className="rounded-md bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 ring-1 ring-zinc-800">
                  {typeLabel}
                </span>
              ) : null}
              {overs && overs !== "—" ? (
                <LiveScoreUpdater
                  flash={scoreFlash?.overs}
                  className="text-[11px] font-medium tabular-nums text-zinc-500"
                >
                  Ovs {overs}
                </LiveScoreUpdater>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {isFavorite ? (
              <Badge className="border border-emerald-700/50 bg-emerald-950/55 uppercase tracking-wide text-[10px] font-semibold text-emerald-200">
                Following
              </Badge>
            ) : null}
            {featured ? (
              <Badge className="border border-amber-600/50 bg-amber-950/60 uppercase tracking-wide text-[10px] font-semibold text-amber-200">
                Featured
              </Badge>
            ) : null}
            {isIplLeague ? (
              <Badge
                variant="outline"
                className="border-violet-700/60 bg-violet-950/50 uppercase tracking-wide text-[10px] font-semibold text-violet-200"
              >
                IPL
              </Badge>
            ) : null}
            {isLive ? (
              <LiveBadge />
            ) : (
              <Badge
                variant="secondary"
                className="uppercase tracking-wide text-[10px] font-semibold text-zinc-400"
              >
                FT
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-zinc-200">{team1}</span>
            <LiveScoreUpdater
              flash={scoreFlash?.score1}
              className="tabular-nums text-lg font-semibold tracking-tight text-zinc-50"
            >
              {score1 || "—"}
            </LiveScoreUpdater>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-zinc-200">{team2}</span>
            <LiveScoreUpdater
              flash={scoreFlash?.score2}
              className="tabular-nums text-lg font-semibold tracking-tight text-zinc-50"
            >
              {score2 || "—"}
            </LiveScoreUpdater>
          </div>
          {isLive && lastBall ? (
            <p className="truncate text-[12px] leading-snug text-zinc-500">{lastBall}</p>
          ) : null}
          <LiveScoreUpdater
            flash={scoreFlash?.status}
            className="border-t border-zinc-800 pt-3 text-sm leading-relaxed text-zinc-400"
          >
            {status}
          </LiveScoreUpdater>
        </CardContent>
      </Card>
    </Link>
  );
}
