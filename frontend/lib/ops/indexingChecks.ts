import { canonicalUrl, normalizePath } from "@/lib/seo/canonical";
import { isProbablyIndexablePath, robotsSitemapUrl } from "@/lib/seo/indexing";

export type IndexingDiagnostics = {
  canonicalHome: string;
  duplicateTrailingSlashRisk: boolean;
  indexableSamples: { path: string; indexable: boolean }[];
  sitemapProbe?: { ok: boolean; status?: number; error?: string };
};

export function runIndexingPathChecks(): Omit<IndexingDiagnostics, "sitemapProbe"> {
  const home = canonicalUrl("/");
  const rawSite = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const dup = rawSite.endsWith("/");
  const paths = ["/", "/match/demo", "/api/cricket/live", "/~offline", "/team/rcb", "/player/virat-kohli"];
  return {
    canonicalHome: home,
    duplicateTrailingSlashRisk: dup,
    indexableSamples: paths.map((path) => ({
      path,
      indexable: isProbablyIndexablePath(normalizePath(path)),
    })),
  };
}

export async function probeSitemapReachable(): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const url = robotsSitemapUrl();
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Lightweight JSON-LD shape guard for SportsEvent-style objects. */
export function assertJsonLdHasKeys(
  data: Record<string, unknown>,
  keys: string[]
): { ok: boolean; missing: string[] } {
  const missing = keys.filter((k) => !(k in data));
  return { ok: missing.length === 0, missing };
}
