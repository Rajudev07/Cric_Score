import MatchCardSkeleton from "@/components/matches/MatchCardSkeleton";

export default function MatchDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-0">
      <div className="flex flex-wrap items-start justify-between gap-3 py-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
          <div className="h-6 w-64 max-w-full animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-md bg-zinc-800" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="h-3 w-48 animate-pulse rounded bg-zinc-800/80" />

      <div className="flex gap-2 border-b border-zinc-800 pb-1">
        <div className="h-9 w-24 animate-pulse rounded-t-lg bg-zinc-800" />
        <div className="h-9 w-28 animate-pulse rounded-t-lg bg-zinc-800/70" />
        <div className="h-9 w-32 animate-pulse rounded-t-lg bg-zinc-800/70" />
      </div>

      <div className="space-y-2">
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-zinc-800/60 py-3">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-10 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-10 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-zinc-800/60 py-3">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-10 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
