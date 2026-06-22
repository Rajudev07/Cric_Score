import type { Match } from "@/lib/data/matches";
import type { PlayerEntity, TeamEntity } from "@/lib/data/searchCatalog";

export type SearchEntityType = "match" | "team" | "player";

export interface SearchResultItem {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  href: string;
  /** Lower is better for sorting within category */
  rank?: number;
}

export interface CategorizedSearchResults {
  matches: SearchResultItem[];
  teams: SearchResultItem[];
  players: SearchResultItem[];
}

export function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokensFromQuery(q: string): string[] {
  const n = normalizeSearchQuery(q);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

function haystackMatch(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const h = haystack.toLowerCase();
  return tokens.every((t) => h.includes(t));
}

function rankTokens(haystack: string, tokens: string[]): number {
  const h = haystack.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    const i = h.indexOf(t);
    if (i === 0) score += 0;
    else if (i > 0) score += i;
    else score += 1000;
  }
  return score;
}

export function matchToSearchItem(m: Match, tokens: string[]): SearchResultItem | null {
  if (tokens.length === 0) return null;
  const hay = `${m.team1} ${m.team2} ${m.league} ${m.status} ${m.matchType}`;
  if (!haystackMatch(hay, tokens)) return null;
  return {
    id: m.id,
    type: "match",
    title: `${m.team1} vs ${m.team2}`,
    subtitle: `${m.league} · ${m.status.slice(0, 72)}${m.status.length > 72 ? "…" : ""}`,
    href: `/match/${encodeURIComponent(m.id)}`,
    rank: rankTokens(hay, tokens),
  };
}

export function teamToSearchItem(t: TeamEntity, tokens: string[]): SearchResultItem | null {
  if (tokens.length === 0) return null;
  const hay = `${t.name} ${t.shortName} ${t.keywords.join(" ")}`;
  if (!haystackMatch(hay, tokens)) return null;
  return {
    id: t.id,
    type: "team",
    title: t.name,
    subtitle: t.shortName,
    href: `/team/${encodeURIComponent(t.id)}`,
    rank: rankTokens(hay, tokens),
  };
}

export function catalogPlayerToSearchItem(
  p: PlayerEntity,
  tokens: string[]
): SearchResultItem | null {
  if (tokens.length === 0) return null;
  const hay = `${p.name} ${p.team} ${p.role}`;
  if (!haystackMatch(hay, tokens)) return null;
  const hrefId = p.apiPid ?? p.id;
  return {
    id: hrefId,
    type: "player",
    title: p.name,
    subtitle: `${p.team} · ${p.role}`,
    href: `/player/${encodeURIComponent(hrefId)}`,
    rank: rankTokens(hay, tokens),
  };
}

export function apiPlayerToSearchItem(raw: Record<string, unknown>): SearchResultItem | null {
  const pid =
    raw.pid ?? raw.playerId ?? raw.id ?? raw.player_id ?? raw.playerID;
  const name =
    typeof raw.name === "string"
      ? raw.name
      : typeof raw.fullName === "string"
        ? raw.fullName
        : "";
  if (!name || pid === undefined || pid === null) return null;
  const id = String(pid);
  return {
    id,
    type: "player",
    title: name,
    subtitle: typeof raw.country === "string" ? raw.country : "Player",
    href: `/player/${encodeURIComponent(id)}`,
    rank: 500,
  };
}

function sortByRank(items: SearchResultItem[]): SearchResultItem[] {
  return [...items].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
}

export function buildCategorizedResults(
  matches: Match[],
  teams: TeamEntity[],
  catalogPlayers: PlayerEntity[],
  apiPlayerRows: Record<string, unknown>[],
  query: string
): CategorizedSearchResults {
  const tokens = tokensFromQuery(query);
  if (tokens.length === 0) {
    return { matches: [], teams: [], players: [] };
  }

  const matchItems = sortByRank(
    matches
      .map((m) => matchToSearchItem(m, tokens))
      .filter((x): x is SearchResultItem => x !== null)
  );

  const teamItems = sortByRank(
    teams
      .map((t) => teamToSearchItem(t, tokens))
      .filter((x): x is SearchResultItem => x !== null)
  );

  const fromCatalog = sortByRank(
    catalogPlayers
      .map((p) => catalogPlayerToSearchItem(p, tokens))
      .filter((x): x is SearchResultItem => x !== null)
  );

  const fromApi = apiPlayerRows
    .map((r) => apiPlayerToSearchItem(r))
    .filter((x): x is SearchResultItem => x !== null);

  const seen = new Set<string>();
  const players: SearchResultItem[] = [];
  for (const p of [...fromCatalog, ...fromApi]) {
    const key = `${p.title.toLowerCase()}|${p.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    players.push(p);
  }
  players.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  return {
    matches: matchItems.slice(0, 12),
    teams: teamItems.slice(0, 10),
    players: players.slice(0, 12),
  };
}

export function flattenSearchResults(
  r: CategorizedSearchResults
): SearchResultItem[] {
  return [...r.matches, ...r.teams, ...r.players];
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      fn(...args);
    }, ms);
  };
}
