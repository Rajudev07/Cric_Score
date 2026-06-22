import type { PressureProfile } from "@/lib/intelligence/pressure";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Meter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "violet" | "amber" | "emerald";
}) {
  const bar =
    tone === "violet"
      ? "from-violet-900 to-violet-500"
      : tone === "amber"
        ? "from-amber-900 to-amber-500"
        : "from-emerald-900 to-emerald-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-300">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-800">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out", bar)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function PressureMeter({ profile }: { profile: PressureProfile }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/90 ring-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-zinc-100">Pressure</CardTitle>
        <p className="text-xs text-zinc-500">{profile.label}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Meter label="Chase / equation" value={profile.chasePressure} tone="violet" />
        <Meter label="Batting lane" value={profile.battingPressure} tone="amber" />
        <Meter label="Bowling squeeze" value={profile.bowlingPressure} tone="emerald" />
        {profile.clutchMoment ? (
          <p className="rounded-md border border-red-900/40 bg-red-950/25 px-2 py-1.5 text-[11px] font-medium text-red-200/95">
            Clutch window detected — leverage swings quickly.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
