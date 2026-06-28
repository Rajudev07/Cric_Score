"use client";

import { useEffect, useState } from "react";

export function useFormattedDate(
  date: string | Date | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (!date) {
      setFormatted("");
      return;
    }
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      setFormatted(
        d.toLocaleString(
          undefined,
          options ?? {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }
        )
      );
    } catch {
      setFormatted("");
    }
  }, [date, options?.timeZone, options?.dateStyle, options?.timeStyle, options?.month, options?.day, options?.year, options?.hour, options?.minute]);

  return formatted;
}
