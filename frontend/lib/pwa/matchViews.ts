const VIEWS_KEY = "cricscore:match-views";
const DISMISS_KEY = "cricscore:pwa-install-dismissed";
const OFFLINE_META_KEY = "cricscore:offline-match-meta";

export function incrementMatchViewCount(): number {
  if (typeof window === "undefined") return 0;
  const n = getMatchViewCount() + 1;
  localStorage.setItem(VIEWS_KEY, String(n));
  window.dispatchEvent(new Event("cricscore:match-view"));
  return n;
}

export function getMatchViewCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(VIEWS_KEY) ?? "0", 10) || 0;
}

export function isInstallDismissed(): boolean {
  return localStorage.getItem(DISMISS_KEY) === "1";
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(DISMISS_KEY, "1");
}

export function recordOfflineMatchMeta(matchId: string): void {
  const meta = { matchId, at: Date.now() };
  localStorage.setItem(`${OFFLINE_META_KEY}:${matchId}`, JSON.stringify(meta));
  const recent = getRecentOfflineMatchIds();
  const next = [matchId, ...recent.filter((id) => id !== matchId)].slice(0, 3);
  localStorage.setItem(`${OFFLINE_META_KEY}:recent`, JSON.stringify(next));
}

export function getRecentOfflineMatchIds(): string[] {
  try {
    const raw = localStorage.getItem(`${OFFLINE_META_KEY}:recent`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function getOfflineMatchMeta(matchId: string): { at: number } | null {
  try {
    const raw = localStorage.getItem(`${OFFLINE_META_KEY}:${matchId}`);
    if (!raw) return null;
    const o = JSON.parse(raw) as { at?: number };
    return o.at ? { at: o.at } : null;
  } catch {
    return null;
  }
}
