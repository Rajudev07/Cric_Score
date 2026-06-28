export const SCHEDULE_TIMEZONES = [
  { value: "UTC", label: "UTC (UTC+0)" },
  { value: "Europe/London", label: "London (Europe/London)" },
  { value: "Asia/Dubai", label: "Dubai (Asia/Dubai)" },
  { value: "Asia/Karachi", label: "Karachi (Asia/Karachi)" },
  { value: "Asia/Kolkata", label: "Delhi (Asia/Kolkata)" },
  { value: "Asia/Dhaka", label: "Dhaka (Asia/Dhaka)" },
  { value: "Asia/Colombo", label: "Colombo (Asia/Colombo)" },
  { value: "Asia/Kathmandu", label: "Kathmandu (Asia/Kathmandu)" },
  { value: "Asia/Rangoon", label: "Yangon (Asia/Rangoon)" },
  { value: "Asia/Bangkok", label: "Bangkok (Asia/Bangkok)" },
  { value: "Asia/Singapore", label: "Singapore (Asia/Singapore)" },
  { value: "Australia/Perth", label: "Perth (Australia/Perth)" },
  { value: "Australia/Darwin", label: "Darwin (Australia/Darwin)" },
  { value: "Australia/Brisbane", label: "Brisbane (Australia/Brisbane)" },
  { value: "Australia/Adelaide", label: "Adelaide (Australia/Adelaide)" },
  { value: "Australia/Sydney", label: "Sydney (Australia/Sydney)" },
  { value: "Pacific/Auckland", label: "Auckland (Pacific/Auckland)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (Africa/Johannesburg)" },
  { value: "Africa/Nairobi", label: "Nairobi (Africa/Nairobi)" },
  { value: "America/New_York", label: "New York (America/New_York)" },
] as const;

export const SCHEDULE_TIMEZONE_STORAGE_KEY = "cricscore-timezone";

export type ScheduleTimezone = (typeof SCHEDULE_TIMEZONES)[number]["value"];

const TIMEZONE_VALUES = new Set<string>(SCHEDULE_TIMEZONES.map((tz) => tz.value));

export function isScheduleTimezone(value: string): value is ScheduleTimezone {
  return TIMEZONE_VALUES.has(value);
}

function offsetMinutes(timeZone: string, date = new Date()): number {
  const utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const second = Number(parts.find((p) => p.type === "second")?.value ?? 0);
  const asUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    minute,
    second
  );
  return (asUtc - utc) / 60_000;
}

export function detectClosestTimezone(): ScheduleTimezone {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (isScheduleTimezone(detected)) return detected;

  const detectedOffset = offsetMinutes(detected);
  let closest: ScheduleTimezone = "UTC";
  let minDiff = Number.POSITIVE_INFINITY;

  for (const tz of SCHEDULE_TIMEZONES) {
    const diff = Math.abs(offsetMinutes(tz.value) - detectedOffset);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tz.value;
    }
  }

  return closest;
}

export function formatMatchTime(iso: string | null, timeZone: string): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;

  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(t));
}

export function dateKeyInTimezone(iso: string | null, timeZone: string): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t));
}
