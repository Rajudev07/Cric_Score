import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RevalidatingIcon({ active, className }: { active?: boolean; className?: string }) {
  if (!active) return null;
  return (
    <RefreshCw
      className={cn("inline-block h-3.5 w-3.5 shrink-0 animate-spin opacity-50", className)}
      aria-hidden
    />
  );
}
