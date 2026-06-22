import type { OpsDiagnosticsSnapshot } from "@/lib/ops/runtimeDiagnostics";

export default function CacheMetricsCard({
  cache,
}: {
  cache: OpsDiagnosticsSnapshot["cache"];
}) {
  const { counts, total, startedAtMs } = cache;
  const hitRate = total > 0 ? counts.hit / total : 0;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-100">Edge cache (Redis)</h2>
      <dl className="grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4">
        <div>
          <dt className="text-zinc-600">hit</dt>
          <dd className="font-mono text-zinc-200">{counts.hit}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">miss</dt>
          <dd className="font-mono text-zinc-200">{counts.miss}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">stale</dt>
          <dd className="font-mono text-zinc-200">{counts.stale}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">off</dt>
          <dd className="font-mono text-zinc-200">{counts.off}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-zinc-500">
        Hit ratio {total ? `${Math.round(hitRate * 100)}%` : "—"} · since{" "}
        {new Date(startedAtMs).toLocaleTimeString()}
      </p>
    </div>
  );
}
