import { ImageResponse } from "next/og";
import type { Match } from "@/lib/data/matches";
import type { TeamEntity } from "@/lib/data/searchCatalog";

export const OG_SIZE = { width: 1200, height: 630 } as const;

export function renderHomeOgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 56,
          background: "linear-gradient(135deg,#09090b 0%,#18181b 55%,#27272a 100%)",
          color: "#fafafa",
          fontFamily: "system-ui,sans-serif",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>CricScore</div>
        <div style={{ marginTop: 16, fontSize: 30, color: "#a1a1aa" }}>
          Live IPL & international scores
        </div>
        <div style={{ marginTop: 36, fontSize: 22, color: "#71717a" }}>cricscore.app</div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

export function renderMatchOgImage(match: Match): ImageResponse {
  const live = match.isLive ? "LIVE" : "SCORECARD";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui,sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, color: "#a1a1aa" }}>{match.league}</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: match.isLive ? "#fbbf24" : "#a1a1aa",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              padding: "8px 16px",
            }}
          >
            {live}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 52, fontWeight: 800 }}>
            {match.team1} <span style={{ color: "#71717a" }}>vs</span> {match.team2}
          </div>
          <div style={{ display: "flex", gap: 40, fontSize: 40, fontWeight: 700 }}>
            <span>{match.score1}</span>
            <span style={{ color: "#52525b" }}>|</span>
            <span>{match.score2}</span>
          </div>
          <div style={{ fontSize: 26, color: "#d4d4d8" }}>{match.status}</div>
        </div>
        <div style={{ fontSize: 20, color: "#71717a" }}>Overs {match.overs}</div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

export function renderTeamOgImage(team: TeamEntity): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 56,
          background: "linear-gradient(135deg,#09090b,#1e1b4b 90%)",
          color: "#fafafa",
          fontFamily: "system-ui,sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#a5b4fc" }}>Team hub</div>
        <div style={{ fontSize: 58, fontWeight: 800, marginTop: 12 }}>{team.name}</div>
        <div style={{ fontSize: 32, color: "#c4b5fd", marginTop: 8 }}>{team.shortName}</div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

export function renderPlayerOgImage(name: string, role: string, team: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 56,
          background: "linear-gradient(135deg,#09090b,#14532d 95%)",
          color: "#fafafa",
          fontFamily: "system-ui,sans-serif",
        }}
      >
        <div style={{ fontSize: 26, color: "#86efac" }}>Player</div>
        <div style={{ fontSize: 56, fontWeight: 800, marginTop: 10 }}>{name}</div>
        <div style={{ fontSize: 28, color: "#bbf7d0", marginTop: 10 }}>
          {role} · {team}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

export function renderFallbackMatchOg(matchId: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui,sans-serif",
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800 }}>CricScore</div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 16 }}>Match scorecard</div>
        <div style={{ fontSize: 22, color: "#71717a", marginTop: 24 }}>ID {matchId}</div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
