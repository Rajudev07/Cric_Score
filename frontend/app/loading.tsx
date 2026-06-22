import MatchCardSkeleton from "@/components/matches/MatchCardSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="h-14 animate-pulse rounded-lg bg-zinc-900/80 ring-1 ring-zinc-800" />
        <div className="space-y-3">
          <div className="h-10 max-w-md animate-pulse rounded-md bg-zinc-900" />
          <div className="h-4 max-w-xl animate-pulse rounded-md bg-zinc-900/70" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      </div>
    </div>
  );
}
