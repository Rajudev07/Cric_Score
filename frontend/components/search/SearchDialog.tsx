"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useSearch } from "@/lib/hooks/useSearch";
import { dispatchAnalytics } from "@/lib/analytics/track";
import type { Match } from "@/lib/data/matches";
import {
  clearSearchHistory,
  getSearchHistory,
  pushSearchHistory,
} from "@/lib/search/history";
import { flattenSearchResults } from "@/lib/utils/search";
import SearchInput from "./SearchInput";
import SearchResults from "./SearchResults";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NavItem =
  | { kind: "result"; flatIndex: number }
  | { kind: "history"; query: string; flatIndex: number }
  | { kind: "live"; matchId: string; flatIndex: number };

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    setQuery,
    debouncedQuery,
    results,
    error,
    isLoading,
    reset,
  } = useSearch(280);

  const [activeFlatIndex, setActiveFlatIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const { data: liveFromCache } = useSWR<Match[]>(
    open ? "cricket-live-current" : null,
    null,
    { fallbackData: [] }
  );

  const liveNow = useMemo(
    () => (liveFromCache ?? []).filter((m) => m.isLive).slice(0, 3),
    [liveFromCache]
  );

  const flat = useMemo(
    () => (results ? flattenSearchResults(results) : []),
    [results]
  );

  const queryReady = debouncedQuery.trim().length >= 2;
  const showEmptyState = !queryReady && query.trim().length === 0;

  const navItems = useMemo((): NavItem[] => {
    if (queryReady) {
      return flat.map((_, i) => ({ kind: "result" as const, flatIndex: i }));
    }
    const items: NavItem[] = [];
    let idx = 0;
    for (const q of history) {
      items.push({ kind: "history", query: q, flatIndex: idx++ });
    }
    for (const m of liveNow) {
      items.push({ kind: "live", matchId: m.id, flatIndex: idx++ });
    }
    return items;
  }, [queryReady, flat, history, liveNow]);

  const navCount = navItems.length;

  useEffect(() => {
    if (open) setHistory(getSearchHistory());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    setActiveFlatIndex(0);
  }, [results, history, liveNow, queryReady]);

  useEffect(() => {
    if (!open) {
      reset();
      setActiveFlatIndex(0);
    }
  }, [open, reset]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const navigateTo = useCallback(
    (href: string, searchQuery?: string) => {
      if (searchQuery) pushSearchHistory(searchQuery);
      dispatchAnalytics({
        kind: "search_submit",
        queryLength: (searchQuery ?? query).trim().length,
        resultsCount: flat.length,
      });
      router.push(href);
      close();
    },
    [close, flat.length, query, router]
  );

  const go = useCallback(() => {
    if (queryReady && flat.length) {
      const item = flat[Math.min(activeFlatIndex, flat.length - 1)];
      if (item) navigateTo(item.href, debouncedQuery.trim());
      return;
    }
    const nav = navItems[activeFlatIndex];
    if (!nav) return;
    if (nav.kind === "history") {
      setQuery(nav.query);
      return;
    }
    if (nav.kind === "live") {
      navigateTo(`/match/${encodeURIComponent(nav.matchId)}`);
    }
  }, [
    activeFlatIndex,
    debouncedQuery,
    flat,
    navItems,
    navigateTo,
    queryReady,
    setQuery,
  ]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const root = dialogRef.current;
    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

    const onDoc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        const list = focusables();
        if (!list.length) return;
        const first = list[0]!;
        const last = list[list.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (queryReady ? flat.length : navCount) {
          const max = queryReady ? flat.length : navCount;
          setActiveFlatIndex((i) => (i + 1) % max);
        }
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (queryReady ? flat.length : navCount) {
          const max = queryReady ? flat.length : navCount;
          setActiveFlatIndex((i) => (i - 1 + max) % max);
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        go();
      }
    };
    document.addEventListener("keydown", onDoc);
    return () => document.removeEventListener("keydown", onDoc);
  }, [open, close, flat.length, go, navCount, queryReady]);

  const onClearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  const pickResult = useCallback(() => {
    if (queryReady) pushSearchHistory(debouncedQuery.trim());
    close();
  }, [close, debouncedQuery, queryReady]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm transition-opacity duration-200"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-xl transition-transform duration-200"
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 ring-2 ring-[var(--color-brand)]/40">
          <div className="border-b border-zinc-800 p-3">
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams, players, matches…"
              aria-label="Search query"
            />
            <p className="mt-2 px-1 text-[11px] text-zinc-600">
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono">
                ↑
              </kbd>{" "}
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono">
                ↓
              </kbd>{" "}
              navigate ·{" "}
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono">
                Enter
              </kbd>{" "}
              open ·{" "}
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono">
                Esc
              </kbd>{" "}
              close
            </p>
          </div>
          <SearchResults
            results={results}
            activeFlatIndex={activeFlatIndex}
            setActiveFlatIndex={setActiveFlatIndex}
            onPick={pickResult}
            loading={isLoading}
            queryMinLength={queryReady}
            error={error instanceof Error ? error : undefined}
            showEmptyState={showEmptyState}
            history={history}
            liveMatches={liveNow}
            onHistoryPick={(q) => setQuery(q)}
            onClearHistory={onClearHistory}
            emptyNavOffset={0}
          />
        </div>
      </div>
    </div>
  );
}
