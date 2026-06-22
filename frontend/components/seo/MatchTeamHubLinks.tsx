import Link from "next/link";
import { resolveCatalogTeamIdFromLabel } from "@/lib/user/favorites";

export default function MatchTeamHubLinks({ team1, team2 }: { team1: string; team2: string }) {
  const id1 = resolveCatalogTeamIdFromLabel(team1);
  const id2 = resolveCatalogTeamIdFromLabel(team2);
  if (!id1 && !id2) return null;
  return (
    <nav
      aria-label="Team hubs"
      className="flex flex-wrap gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm"
    >
      <span className="font-medium text-zinc-500">Teams:</span>
      {id1 ? (
        <Link href={`/team/${encodeURIComponent(id1)}`} className="font-semibold text-violet-300 hover:text-violet-200">
          {team1} hub
        </Link>
      ) : null}
      {id2 ? (
        <Link href={`/team/${encodeURIComponent(id2)}`} className="font-semibold text-violet-300 hover:text-violet-200">
          {team2} hub
        </Link>
      ) : null}
    </nav>
  );
}
