import type { OpsDiagnosticsSnapshot } from "@/lib/ops/runtimeDiagnostics";

function HealthPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold ${
        ok ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-200"
      }`}
    >
      {ok ? "OK" : "WARN"}
    </span>
  );
}

function formatTs(ts: number | null | undefined): string {
  if (ts == null) return "—";
  try {
    return new Date(ts).toISOString();
  } catch {
    return "—";
  }
}

export default function ProviderStatusCard({
  providers,
}: {
  providers: OpsDiagnosticsSnapshot["providers"];
}) {
  const { cricketdata, cricbuzz_scraper, federation } = providers;
  const fed = federation;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-100">Provider health</h2>
        <span className="text-xs text-zinc-500">last {providers.windowMs / 1000}s window</span>
      </div>
      <div className="space-y-3 text-xs text-zinc-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>CricketData</span>
          <div className="flex flex-wrap items-center gap-2">
            {cricketdata.successRate !== null ? (
              <HealthPill ok={cricketdata.successRate >= 0.85} />
            ) : (
              <span className="text-zinc-600">no samples</span>
            )}
            <span className="tabular-nums text-zinc-500">
              n={cricketdata.samples}{" "}
              {cricketdata.avgLatencyMs !== null
                ? `· ${Math.round(cricketdata.avgLatencyMs)}ms avg`
                : null}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Cricbuzz scraper</span>
          <div className="flex flex-wrap items-center gap-2">
            {cricbuzz_scraper.successRate !== null ? (
              <HealthPill ok={cricbuzz_scraper.successRate >= 0.5} />
            ) : (
              <span className="text-zinc-600">no samples</span>
            )}
            <span className="tabular-nums text-zinc-500">
              n={cricbuzz_scraper.samples}{" "}
              {cricbuzz_scraper.avgLatencyMs !== null
                ? `· ${Math.round(cricbuzz_scraper.avgLatencyMs)}ms avg`
                : null}
            </span>
          </div>
        </div>
      </div>

      {fed && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Federation diagnostics
          </h3>
          {"priorityScores" in providers && providers.priorityScores ? (
            <div className="mb-3 rounded-lg bg-zinc-900/50 p-2 text-[11px] text-zinc-400">
              <div className="font-medium text-zinc-300">Provider priority scores</div>
              <div>
                Cricbuzz scraper:{" "}
                {(
                  providers.priorityScores["cricbuzz-scraper"] ??
                  providers.priorityScores.cricbuzz_scraper
                )?.toFixed(2) ?? "—"}
              </div>
              <div>CricketData: {providers.priorityScores.cricketdata?.toFixed(2) ?? "—"}</div>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg bg-zinc-900/50 p-2 text-[11px] leading-relaxed text-zinc-400">
              <div className="font-medium text-zinc-300">CricketData</div>
              <div>Health %: {fed.cricketdata.healthPct ?? "—"}</div>
              <div>IPL success %: {fed.cricketdata.iplSuccessPct ?? "—"}</div>
              <div>Dynamic score: {fed.cricketdata.dynamicScore}</div>
              <div>Last OK: {formatTs(fed.cricketdata.lastOkAt)}</div>
              <div>
                Live rows (avg):{" "}
                {fed.cricketdata.liveContributionAvg !== null
                  ? fed.cricketdata.liveContributionAvg.toFixed(1)
                  : "—"}
              </div>
              <div>Detail commentary %: {fed.cricketdata.detailCommentarySuccessPct ?? "—"}</div>
            </div>
            <div className="space-y-1 rounded-lg bg-zinc-900/50 p-2 text-[11px] leading-relaxed text-zinc-400">
              <div className="font-medium text-zinc-300">Cricbuzz scraper</div>
              <div>Health %: {fed.cricbuzz_scraper.healthPct ?? "—"}</div>
              <div>IPL success %: {fed.cricbuzz_scraper.iplSuccessPct ?? "—"}</div>
              <div>Dynamic score: {fed.cricbuzz_scraper.dynamicScore}</div>
              <div>Last OK: {formatTs(fed.cricbuzz_scraper.lastOkAt)}</div>
              <div>
                Live rows (avg):{" "}
                {fed.cricbuzz_scraper.liveContributionAvg !== null
                  ? fed.cricbuzz_scraper.liveContributionAvg.toFixed(1)
                  : "—"}
              </div>
              <div>Detail commentary %: {fed.cricbuzz_scraper.detailCommentarySuccessPct ?? "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
