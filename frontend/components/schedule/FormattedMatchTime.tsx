"use client";

import { useFormattedDate } from "@/lib/hooks/useFormattedDate";

export default function FormattedMatchTime({
  iso,
  timeZone,
}: {
  iso: string | null;
  timeZone: string;
}) {
  const formatted = useFormattedDate(iso ?? undefined, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (!formatted) return null;

  return (
    <p className="mb-2 text-xs font-medium tabular-nums text-zinc-500">{formatted}</p>
  );
}
