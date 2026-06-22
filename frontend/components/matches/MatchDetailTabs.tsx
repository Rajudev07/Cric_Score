"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

type TabId = "summary" | "scorecard" | "commentary";

const tabs: { id: TabId; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "scorecard", label: "Scorecard" },
  { id: "commentary", label: "Commentary" },
];

interface MatchDetailTabsProps {
  summary: ReactNode;
  scorecard: ReactNode;
  commentary: ReactNode;
  stickyHeader?: ReactNode;
}

export default function MatchDetailTabs({
  summary,
  scorecard,
  commentary,
  stickyHeader,
}: MatchDetailTabsProps) {
  const [tab, setTab] = useState<TabId>("summary");

  const panels: Record<TabId, ReactNode> = {
    summary,
    scorecard,
    commentary,
  };

  const tabBar = (
    <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pb-1 pt-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={cn(
            "rounded-t-lg px-4 py-2 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
            tab === t.id
              ? "border border-b-2 border-b-[var(--color-brand)] border-zinc-700 bg-zinc-900 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {stickyHeader ? (
        <div className="sticky top-0 z-40 -mx-4 border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6">
          {stickyHeader}
          {tabBar}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-1">{tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-semibold tracking-tight transition-colors",
              tab === t.id
                ? "border border-b-2 border-b-[var(--color-brand)] border-zinc-700 bg-zinc-900 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t.label}
          </button>
        ))}</div>
      )}
      <div className="relative min-h-[12rem]">
        {(Object.keys(panels) as TabId[]).map((id) => (
          <div
            key={id}
            className={cn(
              "transition-opacity duration-150 ease-in",
              tab === id
                ? "relative opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0"
            )}
            aria-hidden={tab !== id}
          >
            {panels[id]}
          </div>
        ))}
      </div>
    </div>
  );
}
