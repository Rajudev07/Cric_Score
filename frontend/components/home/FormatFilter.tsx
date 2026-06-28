"use client";

import {
  FORMAT_FILTER_LABELS,
  type FormatFilterId,
} from "@/lib/utils/formatFilter";
import { cn } from "@/lib/utils";

const OPTIONS: FormatFilterId[] = ["all", "test", "odi", "t20i", "women"];

interface FormatFilterProps {
  value: FormatFilterId;
  onChange: (value: FormatFilterId) => void;
}

export default function FormatFilter({ value, onChange }: FormatFilterProps) {
  return (
    <div className="flex w-full flex-wrap justify-center gap-1.5 md:w-auto">
      {OPTIONS.map((id) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "h-7 rounded-full px-3 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--color-brand)] text-white"
                : "border-[0.5px] border-[var(--color-border-tertiary)] bg-transparent text-[var(--color-text-secondary)]"
            )}
          >
            {FORMAT_FILTER_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
