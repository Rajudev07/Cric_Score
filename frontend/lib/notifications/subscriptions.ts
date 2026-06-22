const STORAGE_KEY = "cricscore:match-notify";

export function getMatchNotifySubscriptions(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function isMatchNotifySubscribed(matchId: string): boolean {
  return Boolean(getMatchNotifySubscriptions()[matchId]);
}

export function setMatchNotifySubscribed(matchId: string, on: boolean): void {
  if (typeof window === "undefined") return;
  const cur = getMatchNotifySubscriptions();
  if (on) cur[matchId] = true;
  else delete cur[matchId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
}
