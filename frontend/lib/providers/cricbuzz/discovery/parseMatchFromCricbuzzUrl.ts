import type { Match } from "@/lib/data/matches";
import { expandTeamAbbr } from "@/lib/utils/teamNameExpansion";
import { CRICBUZZ_SCRAPER_PROVIDER_ID } from "@/lib/providers/cricbuzzScraper/transform";

function formatFromSlug(slug: string): string {
  if (slug.includes("test")) return "test";
  if (slug.includes("t20i")) return "t20i";
  if (slug.includes("odi")) return "odi";
  if (slug.includes("t20")) return "t20";
  return "t20";
}

export function parseMatchFromCricbuzzUrl(url: string): Match | null {
  const slugMatch = url.match(/live-cricket-scores\/(\d+)\/([a-z0-9-]+)/i);
  if (!slugMatch) return null;

  const [, matchId, slug] = slugMatch;
  const parts = slug.split("-vs-");
  if (parts.length < 2) return null;

  const team1Abbr = parts[0]!;
  const rest = parts[1]!.split("-");

  const team2Parts: string[] = [];
  for (const part of rest) {
    if (
      /^\d/.test(part) ||
      part === "match" ||
      part === "test" ||
      part === "t20i" ||
      part === "odi" ||
      part === "unofficial" ||
      part === "one" ||
      part === "off"
    ) {
      break;
    }
    team2Parts.push(part);
  }
  const team2Abbr = team2Parts.join("-");

  const team1 = expandTeamAbbr(team1Abbr);
  const team2 = expandTeamAbbr(team2Abbr);

  if (
    !team1 ||
    !team2 ||
    team1.toLowerCase() === team1Abbr.toLowerCase() ||
    team2.toLowerCase() === team2Abbr.toLowerCase()
  ) {
    console.log("[url-parse] skipping unresolved abbr:", team1Abbr, team2Abbr, "from", url);
    return null;
  }

  const format = formatFromSlug(slug);

  return {
    id: `cbzs-url-${matchId}`,
    provider: CRICBUZZ_SCRAPER_PROVIDER_ID,
    league: format,
    team1,
    team2,
    score1: "—",
    score2: "—",
    overs: "—",
    status: "Live",
    isLive: true,
    matchStarted: true,
    matchEnded: false,
    matchType: format,
    startTimeIso: null,
    batting: [],
    bowling: [],
    commentary: [],
  };
}

export function matchesFromDiscoveredUrls(urls: string[]): Match[] {
  const seen = new Set<string>();
  const out: Match[] = [];
  for (const url of urls) {
    const m = parseMatchFromCricbuzzUrl(url);
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}
