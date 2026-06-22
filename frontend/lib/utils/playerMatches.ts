import type { Match } from "@/lib/data/matches";

export type PlayerMatchAppearance = {
  matchId: string;
  league: string;
  opponent: string;
  summary: string;
  phase: string;
};

function nameMatches(playerName: string, rowName: string): boolean {
  const p = playerName.toLowerCase().trim();
  const r = rowName.toLowerCase().trim();
  if (!p || !r) return false;
  if (p === r) return true;
  if (r.includes(p) || p.includes(r)) return true;
  const pl = p.split(/\s+/).pop() ?? "";
  const rl = r.split(/\s+/).pop() ?? "";
  return pl.length > 2 && pl === rl;
}

export function findPlayerRecentMatches(
  playerName: string,
  matches: Match[],
  limit = 5
): PlayerMatchAppearance[] {
  const out: PlayerMatchAppearance[] = [];
  for (const m of matches) {
    const bat = m.batting.find((b) => nameMatches(playerName, b.batter));
    const bowl = m.bowling.find((b) => nameMatches(playerName, b.bowler));
    if (!bat && !bowl) continue;
    const opponent =
      bat || bowl
        ? nameMatches(playerName, m.team1)
          ? m.team2
          : m.team1
        : m.team2;
    let summary = m.status.slice(0, 120);
    if (bat) summary = `${bat.runs} (${bat.balls}) · SR ${bat.sr.toFixed(1)}`;
    else if (bowl) summary = `${bowl.wickets}/${bowl.runs} (${bowl.overs} ov)`;
    out.push({
      matchId: m.id,
      league: m.league,
      opponent,
      summary,
      phase: m.isLive ? "Live" : m.matchEnded ? "Completed" : "Upcoming",
    });
    if (out.length >= limit) break;
  }
  return out;
}
