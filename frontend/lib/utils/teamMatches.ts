import type { Match } from "@/lib/data/matches";
import type { TeamEntity } from "@/lib/data/searchCatalog";
import { getMatchPhase } from "@/lib/utils/matchPriority";

export function teamMatchesMatch(team: TeamEntity, m: Match): boolean {
  const needles = [
    team.shortName.toLowerCase(),
    team.name.toLowerCase(),
    ...team.keywords.map((k) => k.toLowerCase()),
  ];
  const a = m.team1.toLowerCase();
  const b = m.team2.toLowerCase();
  return needles.some((n) => n.length > 1 && (a.includes(n) || b.includes(n)));
}

export function partitionTeamMatches(
  team: TeamEntity,
  matches: Match[]
): { live: Match[]; upcoming: Match[]; completed: Match[] } {
  const live: Match[] = [];
  const upcoming: Match[] = [];
  const completed: Match[] = [];
  const seen = new Set<string>();

  for (const m of matches) {
    if (!teamMatchesMatch(team, m)) continue;
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    const phase = getMatchPhase(m);
    if (phase === "live") live.push(m);
    else if (phase === "upcoming") upcoming.push(m);
    else completed.push(m);
  }

  return { live, upcoming, completed };
}
