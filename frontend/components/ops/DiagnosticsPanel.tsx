"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpsDiagnosticsSnapshot } from "@/lib/ops/runtimeDiagnostics";
import CacheMetricsCard from "@/components/ops/CacheMetricsCard";
import ProviderStatusCard from "@/components/ops/ProviderStatusCard";
import SeoHealthCard from "@/components/ops/SeoHealthCard";
import ScraperHealthCard from "@/components/ops/ScraperHealthCard";

export default function DiagnosticsPanel({ initial }: { initial: OpsDiagnosticsSnapshot }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Deployment diagnostics</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Process-local metrics (providers, cache). Enable in prod with{" "}
            <code className="rounded bg-zinc-900 px-1 text-zinc-300">ENABLE_OPS_DASHBOARD=true</code>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => start(() => router.refresh())}
          disabled={pending}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">Environment checks</h2>
        <ul className="space-y-2 text-xs">
          {initial.deployment.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-zinc-400">
              <span className="font-mono text-zinc-300">{c.id}</span>
              <span className={c.ok ? "text-emerald-400" : "text-amber-300"}>
                {c.detail ?? (c.ok ? "ok" : "missing")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProviderStatusCard providers={initial.providers} />
        <CacheMetricsCard cache={initial.cache} />
      </div>

      <ScraperHealthCard scraper={initial.scraper} />

      <SeoHealthCard indexing={initial.indexing} />

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">Node runtime</h2>
        <pre className="max-h-48 overflow-auto text-xs text-zinc-400">
          {JSON.stringify(initial.runtime, null, 2)}
        </pre>
      </div>
    </div>
  );
}
