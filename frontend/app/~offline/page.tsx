"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-center sm:px-6">
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-6 py-10">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">You are offline</h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            CricScore keeps a cached shell so the app still opens. Reconnect to refresh live scores
            and commentary.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              Try home
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
