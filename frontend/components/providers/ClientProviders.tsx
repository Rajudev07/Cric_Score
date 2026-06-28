"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ConnectivityBar from "@/components/layout/ConnectivityBar";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PwaInstallBanner from "@/components/pwa/PwaInstallBanner";
import NavigationProgress from "@/components/ui/NavigationProgress";
import { dispatchAnalytics } from "@/lib/analytics/track";
import { useAnalyticsPageView } from "@/lib/hooks/useAnalyticsPageView";
import { reportClientRuntimeError } from "@/lib/monitoring/logger";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useAnalyticsPageView();

  useEffect(() => {
    let visibleMs = 0;
    let segmentStart: number | null =
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? performance.now()
        : null;

    const pause = () => {
      if (segmentStart !== null) {
        visibleMs += performance.now() - segmentStart;
        segmentStart = null;
      }
    };

    const resume = () => {
      if (segmentStart === null) segmentStart = performance.now();
    };

    const onVis = () => {
      if (document.visibilityState === "visible") resume();
      else pause();
    };

    const flush = () => {
      pause();
      const sec = Math.round(visibleMs / 1000);
      if (sec >= 2) {
        dispatchAnalytics({
          kind: "engagement_session",
          path: pathname,
          visibleSeconds: sec,
        });
      }
      visibleMs = 0;
      if (document.visibilityState === "visible") resume();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [pathname]);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      reportClientRuntimeError(e.error ?? e.message, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    };
    const onRej = (e: PromiseRejectionEvent) => {
      reportClientRuntimeError(e.reason ?? "unhandledrejection", { type: "unhandledrejection" });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  return (
    <>
      <NavigationProgress />
      <PwaInstallBanner />
      <ConnectivityBar />
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
      <Footer />
    </>
  );
}
