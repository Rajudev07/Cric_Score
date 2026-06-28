import MatchCardSkeleton from "@/components/matches/MatchCardSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-3">
          <div className="h-10 max-w-md animate-pulse rounded-md bg-zinc-900" />
          <div className="h-4 max-w-xl animate-pulse rounded-md bg-zinc-900/70" />
        </div>
        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-1">
          <div className="h-9 w-20 animate-pulse rounded-t-lg bg-zinc-900" />
          <div className="h-9 w-28 animate-pulse rounded-t-lg bg-zinc-900/80" />
          <div className="h-9 w-28 animate-pulse rounded-t-lg bg-zinc-900/80" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      </div>
    </div>
  );
}
