import type { Match } from "@/lib/data/matches";

export type FormatFilterId = "all" | "test" | "odi" | "t20i" | "women";

export const FORMAT_FILTER_LABELS: Record<FormatFilterId, string> = {
  all: "All",
  test: "Test",
  odi: "ODI",
  t20i: "T20I",
  women: "Women's",
};

export const FORMAT_FILTER_STORAGE_KEY = "cricscore-format-filter";

export function isFormatFilterId(value: string): value is FormatFilterId {
  return value === "all" || value === "test" || value === "odi" || value === "t20i" || value === "women";
}

export function matchesFormatFilter(match: Match, filter: FormatFilterId): boolean {
  if (filter === "all") return true;

  const mt = (match.matchType ?? "").toLowerCase();

  if (filter === "test") return mt.includes("test");
  if (filter === "odi") return mt.includes("odi");
  if (filter === "t20i") return mt.includes("t20i") || mt.includes("t20");

  const title = `${match.team1} ${match.team2} ${match.league}`.toLowerCase();
  return title.includes("women");
}

export function filterMatches(matches: Match[], filter: FormatFilterId): Match[] {
  if (filter === "all") return matches;
  return matches.filter((m) => matchesFormatFilter(m, filter));
}
