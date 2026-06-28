"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LiveBadge from "@/components/live/LiveBadge";
import LiveScoreUpdater from "@/components/live/LiveScoreUpdater";
import MatchCardPreview from "@/components/matches/MatchCardPreview";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  isScheduleTimezone,
  SCHEDULE_TIMEZONE_STORAGE_KEY,
} from "@/lib/schedule/timezones";
import { useFormattedDate } from "@/lib/hooks/useFormattedDate";
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
  isFavorite?: boolean;
  scoreFlash?: ScoreFlash;
  lastBall?: string | null;
  startTimeIso?: string | null;
}

function formatMatchType(mt: string): string {
  const s = mt.trim();
  if (!s) return "";
  return s.length <= 12 ? s.toUpperCase() : s.slice(0, 12).toUpperCase() + "…";
}

function isInvalidTeamName(name: string): boolean {
  const t = name.trim().toLowerCase();
  return !t || t === "cricket";
}

function displayScore(score: string, isLive: boolean): string {
  if (score && score !== "—") return score;
  return isLive ? "—" : "Yet to bat";
}

function shouldFormatStartStatus(
  status: string,
  startTimeIso: string | null | undefined
): boolean {
  if (!startTimeIso) return false;
  return /starts?\s+at|scheduled|yet to start/i.test(status) || /\bgmt\b|\butc\b/i.test(status);
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
  startTimeIso,
}: MatchCardProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finePointer = useRef(false);
  const [previewMounted, setPreviewMounted] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<"above" | "below">("above");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    finePointer.current = window.matchMedia("(pointer: fine)").matches;
    const stored = localStorage.getItem(SCHEDULE_TIMEZONE_STORAGE_KEY);
    if (stored && isScheduleTimezone(stored)) {
      setTimezone(stored);
    }
  }, []);

  const formatStart = shouldFormatStartStatus(status, startTimeIso);
  const formattedStart = useFormattedDate(
    formatStart ? (startTimeIso ?? undefined) : undefined,
    {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );

  const closePreview = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setPreviewVisible(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPreviewMounted(false), 100);
  }, []);

  const openPreview = useCallback(() => {
    if (!isLive || !finePointer.current) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    setPreviewPosition(rect && rect.top < 200 ? "below" : "above");
    setPreviewMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPreviewVisible(true));
    });
  }, [isLive]);

  const handleMouseEnter = () => {
    router.prefetch(`/match/${id}`);
    if (!isLive || !finePointer.current) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(openPreview, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (previewMounted) closePreview();
  };

  useEffect(() => {
    if (!previewMounted) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    const onClick = () => closePreview();

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [previewMounted, closePreview]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (isInvalidTeamName(team1) || isInvalidTeamName(team2)) {
    return null;
  }

  const typeLabel = matchType ? formatMatchType(matchType) : "";
  const isIplLeague = /\bipl\b|indian premier league/i.test(league);
  const statusLine =
    formatStart && formattedStart ? `Starts ${formattedStart}` : status;
  const score1Display = displayScore(score1, isLive);
  const score2Display = displayScore(score2, isLive);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
                {score1Display}
              </LiveScoreUpdater>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-zinc-200">{team2}</span>
              <LiveScoreUpdater
                flash={scoreFlash?.score2}
                className="tabular-nums text-lg font-semibold tracking-tight text-zinc-50"
              >
                {score2Display}
              </LiveScoreUpdater>
            </div>
            {isLive && lastBall ? (
              <p className="truncate text-[12px] leading-snug text-zinc-500">{lastBall}</p>
            ) : null}
            <LiveScoreUpdater
              flash={scoreFlash?.status}
              className="border-t border-zinc-800 pt-3 text-sm leading-relaxed text-zinc-400"
            >
              {statusLine}
            </LiveScoreUpdater>
          </CardContent>
        </Card>
      </Link>

      {previewMounted && isLive ? (
        <MatchCardPreview
          matchId={id}
          team1={team1}
          team2={team2}
          score1={score1}
          score2={score2}
          status={status}
          position={previewPosition}
          visible={previewVisible}
        />
      ) : null}
    </div>
  );
}
