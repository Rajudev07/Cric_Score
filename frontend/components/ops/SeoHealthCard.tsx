import { assertJsonLdHasKeys } from "@/lib/ops/indexingChecks";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/structuredData";
import type { OpsDiagnosticsSnapshot } from "@/lib/ops/runtimeDiagnostics";

export default function SeoHealthCard({
  indexing,
}: {
  indexing: OpsDiagnosticsSnapshot["indexing"];
}) {
  const org = buildOrganizationJsonLd() as Record<string, unknown>;
  const site = buildWebSiteJsonLd() as Record<string, unknown>;
  const orgShape = assertJsonLdHasKeys(org, ["@context", "@type", "name", "url"]);
  const siteShape = assertJsonLdHasKeys(site, ["@context", "@type", "potentialAction"]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-100">SEO & indexing</h2>
      <ul className="space-y-2 text-xs text-zinc-400">
        <li>
          Canonical home:{" "}
          <span className="break-all font-mono text-zinc-200">{indexing.canonicalHome}</span>
        </li>
        <li>
          Trailing slash env risk:{" "}
          <span className={indexing.duplicateTrailingSlashRisk ? "text-amber-300" : "text-emerald-400"}>
            {indexing.duplicateTrailingSlashRisk ? "yes" : "no"}
          </span>
        </li>
        <li>
          Sitemap probe:{" "}
          {indexing.sitemapProbe?.ok ? (
            <span className="text-emerald-400">HTTP {indexing.sitemapProbe.status}</span>
          ) : (
            <span className="text-amber-300">
              {indexing.sitemapProbe?.error ?? "unreachable"}
            </span>
          )}
        </li>
        <li>
          JSON-LD Organization keys:{" "}
          {orgShape.ok ? (
            <span className="text-emerald-400">ok</span>
          ) : (
            <span className="text-amber-300">missing {orgShape.missing.join(", ")}</span>
          )}
        </li>
        <li>
          JSON-LD WebSite keys:{" "}
          {siteShape.ok ? (
            <span className="text-emerald-400">ok</span>
          ) : (
            <span className="text-amber-300">missing {siteShape.missing.join(", ")}</span>
          )}
        </li>
      </ul>
    </div>
  );
}
