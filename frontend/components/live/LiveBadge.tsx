import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
}

export default function LiveBadge({ className }: LiveBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand)] animate-live-pulse"
        aria-hidden
      />
      <Badge className="border border-[var(--color-brand-dark)] bg-[var(--color-brand)] uppercase tracking-wide text-[10px] font-semibold text-white shadow-sm">
        LIVE
      </Badge>
    </span>
  );
}
