"use client";

import Link from "next/link";
import type { Match } from "@/lib/data/matches";
import LiveBadge from "@/components/live/LiveBadge";
import LiveScoreUpdater from "@/components/live/LiveScoreUpdater";
import type { ScoreFlash } from "@/lib/types/live";
import {
  countryCodeForTeam,
  featuredMatchDerived,
  flagEmoji,
  isHighProfileFeaturedMatch,
} from "@/lib/utils/featuredMatch";
import { expandTeamShortCode } from "@/lib/utils/teamNameExpansion";
import { cn } from "@/lib/utils";

export { isHighProfileFeaturedMatch };

interface FeaturedMatchProps {
  match: Match;
  scoreFlash?: ScoreFlash;
}

function BallChip({ display, kind }: { display: string; kind?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
        kind === "wicket" && "bg-red-100 text-red-700",
        kind === "four" && "bg-blue-100 text-blue-700",
        kind === "six" && "bg-purple-100 text-purple-700",
        kind === "dot" && "bg-gray-100 text-gray-500",
        !kind || kind === "runs" ? "border border-zinc-600 bg-zinc-900 text-zinc-100" : ""
      )}
    >
      {display}
    </span>
  );
}

export default function FeaturedMatch({ match, scoreFlash }: FeaturedMatchProps) {
  const t1 = expandTeamShortCode(match.team1);
  const t2 = expandTeamShortCode(match.team2);
  const c1 = countryCodeForTeam(match.team1);
  const c2 = countryCodeForTeam(match.team2);
  const { lastOverBalls, winProb, reqRate, currRate } = featuredMatchDerived(match);

  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-2xl border border-[var(--color-brand-dark)] bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 shadow-xl ring-1 ring-[var(--color-brand)]/25 transition hover:border-[var(--color-brand)]"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {match.league}
        </p>
        <LiveBadge />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-lg font-medium text-zinc-100">
            {c1 ? <span aria-hidden>{flagEmoji(c1)}</span> : null}
            {t1}
          </span>
          <LiveScoreUpdater
            flash={scoreFlash?.score1}
            className="text-3xl font-semibold tabular-nums text-zinc-50"
          >
            {match.score1 || "—"}
          </LiveScoreUpdater>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-lg font-medium text-zinc-100">
            {c2 ? <span aria-hidden>{flagEmoji(c2)}</span> : null}
            {t2}
          </span>
          <LiveScoreUpdater
            flash={scoreFlash?.score2}
            className="text-3xl font-semibold tabular-nums text-zinc-50"
          >
            {match.score2 || "—"}
          </LiveScoreUpdater>
        </div>
      </div>
      {(reqRate || currRate) && (
        <p className="mt-3 text-sm text-zinc-400">
          {reqRate ? `Required ${reqRate} rpo` : null}
          {reqRate && currRate ? " · " : null}
          {currRate ? `Current ${currRate} rpo` : null}
        </p>
      )}
      {lastOverBalls.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-end gap-1.5">
          {lastOverBalls.map((b) => (
            <BallChip key={b.ballDecimal} display={b.display} kind={b.kind} />
          ))}
        </div>
      ) : null}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
          <span>{t1} {winProb.team1Pct}%</span>
          <span>{t2} {winProb.team2Pct}%</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="bg-[var(--color-brand)] transition-[width] duration-500"
            style={{ width: `${winProb.team1Pct}%` }}
          />
          <div
            className="bg-[var(--color-brand-dark)] transition-[width] duration-500"
            style={{ width: `${winProb.team2Pct}%` }}
          />
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-400">{match.status}</p>
    </Link>
  );
}
