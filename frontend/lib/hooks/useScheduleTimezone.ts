"use client";

import { useCallback, useEffect, useState } from "react";
import {
  detectClosestTimezone,
  isScheduleTimezone,
  SCHEDULE_TIMEZONE_STORAGE_KEY,
  type ScheduleTimezone,
} from "@/lib/schedule/timezones";

let sharedTimezone: ScheduleTimezone = "UTC";
let initialized = false;
const listeners = new Set<(tz: ScheduleTimezone) => void>();

function readInitialTimezone(): ScheduleTimezone {
  const stored = localStorage.getItem(SCHEDULE_TIMEZONE_STORAGE_KEY);
  if (stored && isScheduleTimezone(stored)) return stored;
  return detectClosestTimezone();
}

function initTimezoneOnce() {
  if (initialized) return;
  sharedTimezone = readInitialTimezone();
  initialized = true;
}

function notifyTimezone(tz: ScheduleTimezone) {
  sharedTimezone = tz;
  for (const listener of listeners) listener(tz);
}

export function useScheduleTimezone() {
  const [timezone, setTimezoneState] = useState<ScheduleTimezone>(sharedTimezone);

  useEffect(() => {
    initTimezoneOnce();
    setTimezoneState(sharedTimezone);

    const onChange = (tz: ScheduleTimezone) => setTimezoneState(tz);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const setTimezone = useCallback((tz: ScheduleTimezone) => {
    localStorage.setItem(SCHEDULE_TIMEZONE_STORAGE_KEY, tz);
    notifyTimezone(tz);
  }, []);

  return { timezone, setTimezone };
}
