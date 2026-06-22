import type { TeamFormResult } from "@/lib/utils/teamForm";
import { cn } from "@/lib/utils";

export default function TeamFormDots({ results }: { results: TeamFormResult[] }) {
  if (!results.length) {
    return <p className="text-sm text-zinc-500">No recent results in feed.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2" aria-label="Last 10 match results">
      {results.map((r, i) => (
        <span
          key={i}
          title={r}
          className={cn(
            "inline-block h-3 w-3 rounded-full",
            r === "win" && "bg-emerald-500",
            r === "loss" && "bg-red-500",
            r === "draw" && "bg-zinc-500"
          )}
        />
      ))}
    </div>
  );
}
