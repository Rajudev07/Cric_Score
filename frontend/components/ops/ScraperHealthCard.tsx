import type { CricbuzzScraperRunDiagnostics } from "@/lib/providers/cricbuzzScraper";

export default function ScraperHealthCard({
  scraper,
}: {
  scraper: CricbuzzScraperRunDiagnostics | null;
}) {
  if (!scraper) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-100">Cricbuzz scraper</h2>
        <p className="text-xs text-zinc-500">No scraper run recorded in this process yet.</p>
      </div>
    );
  }

  const strategies = scraper.extractionTrace
    .map((t) => `${t.name}:${t.rootsAdded > 0 ? "ok" : t.parseOk ? "ok0" : "fail"}`)
    .join(" → ");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-100">Cricbuzz scraper</h2>
      <dl className="space-y-2 text-xs text-zinc-400">
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-600">fetch</dt>
          <dd className={scraper.fetchOk ? "text-emerald-400" : "text-amber-300"}>
            {scraper.fetchOk ? `HTTP ${scraper.fetchStatus ?? "?"}` : "failed"} ·{" "}
            {scraper.finalUrl ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-600">HTML</dt>
          <dd className="font-mono text-zinc-200">{scraper.htmlLength} bytes</dd>
        </div>
        <div>
          <dt className="text-zinc-600">markers</dt>
          <dd className="mt-1 font-mono text-[10px] leading-relaxed text-zinc-300">
            {Object.entries(scraper.htmlMarkers)
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(", ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-600">strategies</dt>
          <dd className="mt-1 break-all text-zinc-300">{strategies || "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-600">roots / rows / out</dt>
          <dd className="font-mono text-zinc-200">
            {scraper.rootsFound} / {scraper.rowsParsedPreTransform} / {scraper.rowsAfterTransform} (
            IPL safety {scraper.rowsAfterIplSafety}) · IPL count {scraper.iplDetectedCount}
          </dd>
        </div>
        {scraper.parseFailures.length > 0 ? (
          <div>
            <dt className="text-zinc-600">parse failures</dt>
            <dd className="mt-1 text-amber-200/90">
              {scraper.parseFailures.map((p) => `${p.where}: ${p.detail}`).join(" · ")}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-[10px] text-zinc-600">at {scraper.atIso}</p>
    </div>
  );
}
