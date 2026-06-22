import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MatchCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "block rounded-xl",
        featured &&
          "relative before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:ring-2 before:ring-amber-500/45 before:ring-offset-2 before:ring-offset-black"
      )}
    >
      <Card className="h-full border-zinc-800 bg-zinc-900 ring-zinc-800">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-zinc-800" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-12 animate-pulse rounded-md bg-zinc-800" />
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-800/80" />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <div className="h-5 w-14 animate-pulse rounded-md bg-zinc-800" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <div className="h-5 w-28 animate-pulse rounded bg-zinc-800" />
            <div className="h-7 w-16 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="h-5 w-28 animate-pulse rounded bg-zinc-800" />
            <div className="h-7 w-16 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="border-t border-zinc-800 pt-3">
            <div className="h-4 w-full max-w-[280px] animate-pulse rounded bg-zinc-800/80" />
            <div className="mt-2 h-4 w-4/5 max-w-[220px] animate-pulse rounded bg-zinc-800/60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
