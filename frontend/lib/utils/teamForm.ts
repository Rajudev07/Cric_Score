import type { Match } from "@/lib/data/matches";
import type { TeamEntity } from "@/lib/data/searchCatalog";
import { teamMatchesMatch } from "@/lib/utils/teamMatches";

export type TeamFormResult = "win" | "loss" | "draw";

export function inferTeamMatchResult(team: TeamEntity, m: Match): TeamFormResult {
  const st = m.status.toLowerCase();
  if (/tied|no result|abandon|draw/.test(st)) return "draw";
  if (!/won by|beat |defeat/.test(st)) return "draw";
  const needles = [
    team.shortName.toLowerCase(),
    team.name.toLowerCase(),
    ...team.keywords.map((k) => k.toLowerCase()),
  ];
  if (needles.some((n) => n.length > 2 && st.includes(n))) return "win";
  return "loss";
}

export function teamLastTenForm(team: TeamEntity, completed: Match[]): TeamFormResult[] {
  return completed
    .filter((m) => teamMatchesMatch(team, m))
    .slice(0, 10)
    .map((m) => inferTeamMatchResult(team, m));
}
