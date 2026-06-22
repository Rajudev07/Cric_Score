const HISTORY_KEY = "cricscore:search-history";
const MAX = 5;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  const prev = getSearchHistory().filter((s) => s.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX)));
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
