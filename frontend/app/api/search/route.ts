import { NextResponse } from "next/server";
import {
  getLiveMatches,
  getUpcomingMatches,
  searchPlayersByName,
} from "@/lib/api/cricapi";
import type { Match } from "@/lib/data/matches";
import { playerCatalog, teamCatalog } from "@/lib/data/searchCatalog";
import { rankSearchResults } from "@/lib/search/ranking";
import { buildCategorizedResults } from "@/lib/utils/search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    if (q.trim().length < 2) {
      return NextResponse.json({
        ok: true,
        data: { matches: [], teams: [], players: [] },
      });
    }

    const [liveRes, upRes, playerRes] = await Promise.all([
      getLiveMatches(),
      getUpcomingMatches(),
      searchPlayersByName(q),
    ]);

    const merged: Match[] = [];
    if (liveRes.ok) merged.push(...liveRes.data);
    if (upRes.ok) merged.push(...upRes.data);

    const byId = new Map<string, Match>();
    for (const m of merged) {
      byId.set(m.id, m);
    }
    const uniqueMatches = [...byId.values()];

    const apiPlayers = playerRes.ok ? playerRes.data : [];

    const raw = buildCategorizedResults(
      uniqueMatches,
      teamCatalog,
      playerCatalog,
      apiPlayers,
      q
    );

    const data = {
      matches: rankSearchResults(raw.matches, q, uniqueMatches),
      teams: rankSearchResults(raw.teams, q, uniqueMatches),
      players: rankSearchResults(raw.players, q, uniqueMatches),
    };

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Search unavailable" },
      { status: 503 }
    );
  }
}
