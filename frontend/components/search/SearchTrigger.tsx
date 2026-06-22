"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  onOpen: () => void;
  className?: string;
}

export default function SearchTrigger({ onOpen, className }: SearchTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onOpen}
      className={cn(
        "min-h-[44px] gap-2 border-zinc-700 bg-zinc-950/80 px-3 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-200",
        className
      )}
    >
      <span className="hidden text-sm sm:inline">Search…</span>
      <span className="sm:hidden">
        <Search className="size-4" aria-hidden />
      </span>
      <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500 sm:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
