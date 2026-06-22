import type { Match } from "@/lib/data/matches";
import type { SearchResultItem } from "@/lib/utils/search";
import { getMatchPhase } from "@/lib/utils/matchPriority";
import { normalizeSearchQuery } from "@/lib/utils/search";

const RECENT_VIEWS_KEY = "cricscore:recent-views";

const LIVE_TEAM_KEYS = new Set<string>();

export function indexLiveTeams(matches: Match[]): void {
  LIVE_TEAM_KEYS.clear();
  for (const m of matches) {
    if (getMatchPhase(m) !== "live") continue;
    for (const t of [m.team1, m.team2]) {
      LIVE_TEAM_KEYS.add(t.toLowerCase().trim());
    }
  }
}

function getRecentViewBoost(href: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(RECENT_VIEWS_KEY);
    if (!raw) return 0;
    const arr = JSON.parse(raw) as string[];
    const i = arr.indexOf(href);
    if (i < 0) return 0;
    return 40 - i * 8;
  } catch {
    return 0;
  }
}

function phaseBoostForMatch(matches: Match[], matchId: string): number {
  const m = matches.find((x) => x.id === matchId);
  if (!m) return 0;
  const phase = getMatchPhase(m);
  if (phase === "live") return 300;
  if (phase === "upcoming") return 120;
  return 0;
}

function exactnessBoost(query: string, title: string, subtitle?: string): number {
  const q = normalizeSearchQuery(query);
  const t = title.toLowerCase();
  const s = (subtitle ?? "").toLowerCase();
  if (t === q || t.includes(q) && q.length >= 4) return 80;
  if (t.startsWith(q)) return 50;
  if (s.includes(q)) return 20;
  return 0;
}

function liveEntityBoost(title: string, subtitle?: string): number {
  const hay = `${title} ${subtitle ?? ""}`.toLowerCase();
  for (const key of LIVE_TEAM_KEYS) {
    if (key.length > 2 && hay.includes(key)) return 60;
  }
  return 0;
}

export function rankSearchResults(
  results: SearchResultItem[],
  query: string,
  matches: Match[],
  opts?: { clientSide?: boolean }
): SearchResultItem[] {
  indexLiveTeams(matches);
  return [...results]
    .map((item) => {
      let score = 1000 - (item.rank ?? 500);
      if (item.type === "match") {
        score += phaseBoostForMatch(matches, item.id);
      } else {
        score += liveEntityBoost(item.title, item.subtitle);
      }
      score += exactnessBoost(query, item.title, item.subtitle);
      if (opts?.clientSide) score += getRecentViewBoost(item.href);
      if (item.type === "match") score += 30;
      else if (item.type === "team") score += 15;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

export function recordRecentView(href: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RECENT_VIEWS_KEY);
    const prev: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [href, ...prev.filter((h) => h !== href)].slice(0, 5);
    localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
