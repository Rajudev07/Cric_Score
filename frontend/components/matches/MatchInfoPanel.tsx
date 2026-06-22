import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MatchInfoFields } from "@/lib/utils/liveMatchDerived";
import { cn } from "@/lib/utils";

interface MatchInfoPanelProps {
  info: MatchInfoFields;
  isRefreshing?: boolean;
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="text-sm text-zinc-200 sm:text-right">{value}</span>
    </div>
  );
}

export default function MatchInfoPanel({
  info,
  isRefreshing = false,
}: MatchInfoPanelProps) {
  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900 ring-zinc-800 transition-opacity duration-300",
        isRefreshing && "opacity-85"
      )}
    >
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="text-lg text-zinc-100">Match info</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Row label="Tournament" value={info.tournament} />
          <Row label="Match type" value={info.matchType} />
          <Row label="Match no." value={info.matchNumber} />
          <Row label="Start" value={info.startDisplay} />
        </div>
        <div className="space-y-3">
          <Row label="Venue" value={info.venue} />
          <Row label="Toss" value={info.toss} />
          <Row label="Decision" value={info.decision} />
        </div>
      </CardContent>
    </Card>
  );
}
