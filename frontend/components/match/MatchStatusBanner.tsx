"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/lib/data/matches";
import { getMatchPhase } from "@/lib/utils/matchPriority";

function useCountdown(targetIso: string | null): string | null {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!targetIso) return;
    const tick = () => {
      const t = Date.parse(targetIso);
      if (!Number.isFinite(t)) return;
      const diff = t - Date.now();
      if (diff <= 0) {
        setLabel("Starting soon");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLabel(h > 0 ? `Starts in ${h}h ${m}m ${s}s` : `Starts in ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return label;
}

export default function MatchStatusBanner({ match }: { match: Match }) {
  const phase = getMatchPhase(match);
  const countdown = useCountdown(phase === "upcoming" ? match.startTimeIso : null);

  let text = match.status;
  if (phase === "live") {
    const session = match.status.match(/(day\s+\d+[^,]*|session\s+\d+[^,]*|innings break[^,]*)/i);
    text = session?.[1] ?? match.status.slice(0, 120);
  } else if (phase === "completed") {
    const won = match.status.match(/(.+won by[^.|]+)/i);
    text = won?.[1]?.trim() ?? match.status.slice(0, 100);
  } else if (countdown) {
    text = countdown;
  }

  const tone =
    phase === "live"
      ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-100"
      : phase === "completed"
        ? "border-zinc-700 bg-zinc-900 text-zinc-300"
        : "border-violet-900/40 bg-violet-950/25 text-violet-100";

  return (
    <div className={`-mx-4 border-y px-4 py-3 text-center text-sm font-medium sm:-mx-6 sm:px-6 ${tone}`}>
      {text}
    </div>
  );
}
