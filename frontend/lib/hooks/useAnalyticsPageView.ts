"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { dispatchAnalytics } from "@/lib/analytics/track";

export function useAnalyticsPageView(): void {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;

    dispatchAnalytics({
      kind: "page_view",
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
    });

    const match = /^\/match\/([^/]+)/.exec(pathname);
    if (match) {
      dispatchAnalytics({
        kind: "match_open",
        matchId: decodeURIComponent(match[1]),
        path: pathname,
      });
    }
  }, [pathname]);
}
