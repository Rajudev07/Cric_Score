"use client";

import Link from "next/link";
import type { SearchResultItem } from "@/lib/utils/search";
import { cn } from "@/lib/utils";

interface SearchResultCardProps {
  item: SearchResultItem;
  active: boolean;
  onMouseEnter: () => void;
  onNavigate: () => void;
}

const typeLabel: Record<SearchResultItem["type"], string> = {
  match: "Match",
  team: "Team",
  player: "Player",
};

export default function SearchResultCard({
  item,
  active,
  onMouseEnter,
  onNavigate,
}: SearchResultCardProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
        active
          ? "border-[var(--color-brand)] bg-[var(--color-brand-light)]/10 ring-1 ring-[var(--color-brand)]/50"
          : "hover:border-zinc-800 hover:bg-zinc-900/80"
      )}
    >
      <span className="mt-0.5 shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        {typeLabel[item.type]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-zinc-100">{item.title}</span>
        {item.subtitle ? (
          <span className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
            {item.subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
