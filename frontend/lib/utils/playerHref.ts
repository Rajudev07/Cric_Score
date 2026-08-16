import { getPlayerCatalogById, playerCatalog } from "@/lib/data/searchCatalog";

export function slugifyPlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolvePlayerHref(playerName: string): string | null {
  const slug = slugifyPlayerName(playerName);
  if (getPlayerCatalogById(slug)) return `/player/${encodeURIComponent(slug)}`;
  const byName = playerCatalog.find(
    (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
  );
  if (byName) return `/player/${encodeURIComponent(byName.id)}`;
  return null;
}
