"use client";

import { useEffect, useState } from "react";
import type { WinProbabilityEstimate } from "@/lib/intelligence/winProbability";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Point = { team1Pct: number; team2Pct: number };

interface WinProbabilityChartProps {
  matchId: string;
  estimate: WinProbabilityEstimate;
  team1: string;
  team2: string;
}

const W = 320;
const H = 120;
const PAD = 8;

function toPath(points: number[]): string {
  if (!points.length) return "";
  return points
    .map((y, i) => {
      const x = PAD + (i / Math.max(1, points.length - 1)) * (W - PAD * 2);
      const py = H - PAD - (y / 100) * (H - PAD * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
}

export default function WinProbabilityChart({
  matchId,
  estimate,
  team1,
  team2,
}: WinProbabilityChartProps) {
  const [history, setHistory] = useState<Point[]>([]);

  useEffect(() => {
    setHistory([]);
  }, [matchId]);

  useEffect(() => {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.team1Pct === estimate.team1Pct &&
        last.team2Pct === estimate.team2Pct
      ) {
        return prev;
      }
      const next = [...prev, { team1Pct: estimate.team1Pct, team2Pct: estimate.team2Pct }];
      return next.length > 24 ? next.slice(-24) : next;
    });
  }, [estimate.team1Pct, estimate.team2Pct]);

  const team1Series = history.map((p) => p.team1Pct);
  const team2Series = history.map((p) => p.team2Pct);

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 ring-zinc-800">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-zinc-100">
          Win probability
        </CardTitle>
        <Badge variant="outline" className="border-zinc-700 text-[10px] uppercase text-zinc-400">
          {estimate.chaseActive ? "Chase model" : "Heuristic"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs leading-relaxed text-zinc-500">{estimate.note}</p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-28 w-full max-w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={toPath(team2Series)}
            fill="none"
            stroke="rgb(52, 211, 153)"
            strokeWidth="2"
            className="transition-all duration-300 ease-out"
          />
          <path
            d={toPath(team1Series)}
            fill="none"
            stroke="rgb(139, 92, 246)"
            strokeWidth="2"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-400">
          <span className="truncate text-violet-300">
            {team1} {estimate.team1Pct}%
          </span>
          <span className="truncate text-emerald-300">
            {team2} {estimate.team2Pct}%
          </span>
        </div>
        <p className="text-[11px] text-zinc-500">
          Confidence {Math.round(estimate.confidence * 100)}% · favored:{" "}
          {estimate.favored === "even"
            ? "dead heat"
            : estimate.favored === "team1"
              ? team1
              : team2}
        </p>
      </CardContent>
    </Card>
  );
}
