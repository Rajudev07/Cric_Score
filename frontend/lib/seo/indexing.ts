import { siteBaseUrl } from "@/lib/seo/canonical";
import { playerCatalog, teamCatalog } from "@/lib/data/searchCatalog";

/** Public routes safe for indexing (documentation / guardrails). */
export const INDEXABLE_PREFIXES = ["/", "/match/", "/team/", "/player/"] as const;

export function isProbablyIndexablePath(pathname: string): boolean {
  const p = pathname.split("?")[0] ?? "";
  if (p.startsWith("/api")) return false;
  if (p.startsWith("/_next")) return false;
  if (p === "/~offline") return false;
  return INDEXABLE_PREFIXES.some((pre) => (pre === "/" ? p === "/" : p.startsWith(pre)));
}

export function robotsSitemapUrl(): string {
  return `${siteBaseUrl()}/sitemap.xml`;
}

export function robotsHost(): string {
  return new URL(siteBaseUrl()).host;
}

/** Resolve a franchise/team label (e.g. catalog `team` field) to a team hub slug when possible. */
export function resolveTeamHubSlugFromLabel(label: string): string | null {
  const lower = label.toLowerCase();
  for (const t of teamCatalog) {
    if (lower.includes(t.shortName.toLowerCase())) return t.id;
    if (lower.includes(t.id)) return t.id;
    if (t.keywords.some((k) => lower.includes(k))) return t.id;
  }
  return null;
}

export function findPlayerSlugByName(name: string): string | null {
  const n = name.trim().toLowerCase();
  const hit = playerCatalog.find((p) => p.name.trim().toLowerCase() === n);
  return hit?.id ?? null;
}
