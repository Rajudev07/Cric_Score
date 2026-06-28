"use client";

import { useScheduleTimezone } from "@/lib/hooks/useScheduleTimezone";
import { SCHEDULE_TIMEZONES } from "@/lib/schedule/timezones";

export default function TimezoneSelector() {
  const { timezone, setTimezone } = useScheduleTimezone();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <label htmlFor="schedule-timezone" className="text-xs text-[var(--color-text-secondary)]">
        Timezone:
      </label>
      <select
        id="schedule-timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value as typeof timezone)}
        className="h-8 w-40 rounded-lg border border-[var(--color-border-tertiary)] bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {SCHEDULE_TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
}
