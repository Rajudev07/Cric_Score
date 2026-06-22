"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  isMatchNotifySubscribed,
  setMatchNotifySubscribed,
} from "@/lib/notifications/subscriptions";
import { cn } from "@/lib/utils";

export default function MatchNotifyBell({
  matchId,
  label,
}: {
  matchId: string;
  label: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isMatchNotifySubscribed(matchId));
  }, [matchId]);

  return (
    <button
      type="button"
      aria-label={on ? `Unsubscribe from ${label} live alert` : `Notify when ${label} goes live`}
      title={on ? "Match start alerts on" : "Notify when match goes live"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !on;
        setMatchNotifySubscribed(matchId, next);
        setOn(next);
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
        on
          ? "border-[var(--color-brand)] bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]"
          : "border-zinc-700 bg-zinc-950/80 text-zinc-400 hover:text-zinc-200"
      )}
    >
      <Bell className="h-3.5 w-3.5" />
    </button>
  );
}
