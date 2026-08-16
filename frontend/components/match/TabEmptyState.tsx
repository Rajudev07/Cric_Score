import type { LucideIcon } from "lucide-react";

export default function TabEmptyState({
  icon: Icon,
  text,
  subtext,
}: {
  icon: LucideIcon;
  text: string;
  subtext: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-10 text-center"
    >
      <Icon className="h-4 w-4 text-zinc-500" strokeWidth={1.75} aria-hidden />
      <p className="mt-3 text-sm font-medium text-zinc-300">{text}</p>
      <p className="mt-1 text-xs text-zinc-500">{subtext}</p>
    </div>
  );
}
