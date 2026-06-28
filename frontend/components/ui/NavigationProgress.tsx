"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ProgressPhase = "hidden" | "loading" | "completing";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<ProgressPhase>("hidden");
  const [width, setWidth] = useState("0%");
  const prevPathname = useRef(pathname);
  const isFirstRender = useRef(true);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPathname.current = pathname;
      return;
    }

    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (completeTimer.current) clearTimeout(completeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);

    setPhase("loading");
    setWidth("0%");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setWidth("70%");
      });
    });

    completeTimer.current = setTimeout(() => {
      setWidth("100%");
      setPhase("completing");
      hideTimer.current = setTimeout(() => {
        setPhase("hidden");
        setWidth("0%");
      }, 200);
    }, 400);

    return () => {
      if (completeTimer.current) clearTimeout(completeTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  const visible = phase !== "hidden";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-[3px]"
      style={{
        width,
        opacity: visible ? 1 : 0,
        background: "var(--color-brand)",
        transition:
          phase === "completing"
            ? "width 100ms ease-in, opacity 200ms ease-in"
            : "width 300ms ease-out, opacity 200ms ease-in",
      }}
    >
      <div
        className="absolute top-1/2 right-0 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full"
        style={{ background: "var(--color-brand)" }}
      />
    </div>
  );
}
