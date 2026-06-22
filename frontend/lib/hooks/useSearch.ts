"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import type { Match } from "@/lib/data/matches";
import { rankSearchResults } from "@/lib/search/ranking";
import type { CategorizedSearchResults } from "@/lib/utils/search";

async function fetchSearchResults(url: string): Promise<CategorizedSearchResults> {
  const res = await fetch(url);
  const json: unknown = await res.json();
  const body = json as { ok?: boolean; data?: CategorizedSearchResults; error?: string };
  if (!res.ok || !body.ok || !body.data) {
    throw new Error(body.error ?? "Search failed");
  }
  return body.data;
}

export function useSearch(debounceMs = 280) {
  const { cache } = useSWRConfig();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const swrKey = useMemo(() => {
    const q = debounced.trim();
    return q.length >= 2 ? `/api/search?q=${encodeURIComponent(q)}` : null;
  }, [debounced]);

  const { data, error, isLoading, isValidating } = useSWR(
    swrKey,
    fetchSearchResults,
    {
      dedupingInterval: 400,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const rankedResults = useMemo(() => {
    if (!data) return undefined;
    const live = (cache.get("cricket-live-current")?.data as Match[] | undefined) ?? [];
    const q = debounced.trim();
    return {
      matches: rankSearchResults(data.matches, q, live, { clientSide: true }),
      teams: rankSearchResults(data.teams, q, live, { clientSide: true }),
      players: rankSearchResults(data.players, q, live, { clientSide: true }),
    };
  }, [cache, data, debounced]);

  const reset = useCallback(() => {
    setQuery("");
    setDebounced("");
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery: debounced,
    results: rankedResults,
    error,
    isLoading: Boolean(swrKey) && isLoading && !data,
    isValidating,
    reset,
  };
}
