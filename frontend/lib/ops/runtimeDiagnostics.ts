import { getCricbuzzScraperLastDiagnostics, fetchCricbuzzScraperMatches } from "@/lib/providers/cricbuzzScraper";
import { getCacheMetricsSnapshot } from "@/lib/ops/cacheMetrics";
import { runDeploymentChecks } from "@/lib/ops/deploymentChecks";
import { probeSitemapReachable, runIndexingPathChecks } from "@/lib/ops/indexingChecks";
import { getProviderHealthSnapshot } from "@/lib/ops/providerHealth";

export type OpsDiagnosticsSnapshot = Awaited<ReturnType<typeof collectOpsDiagnostics>>;

export function getNodeRuntimeSnapshot() {
  return {
    node: process.version,
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
    memory: process.memoryUsage(),
  };
}

export async function collectOpsDiagnostics() {
  let scraper = getCricbuzzScraperLastDiagnostics();
  try {
    await fetchCricbuzzScraperMatches();
    scraper = getCricbuzzScraperLastDiagnostics();
  } catch {
    /* scraper self-reports via lastRunDiagnostics */
  }

  const indexing = runIndexingPathChecks();
  let sitemapProbe: { ok: boolean; status?: number; error?: string } | undefined;
  try {
    sitemapProbe = await probeSitemapReachable();
  } catch (e) {
    sitemapProbe = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  return {
    deployment: runDeploymentChecks(),
    providers: getProviderHealthSnapshot(),
    cache: getCacheMetricsSnapshot(),
    runtime: getNodeRuntimeSnapshot(),
    indexing: { ...indexing, sitemapProbe },
    scraper,
  };
}

export function isOpsDashboardEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.ENABLE_OPS_DASHBOARD === "true"
  );
}
