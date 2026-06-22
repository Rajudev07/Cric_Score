"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LiveScoreUpdaterProps {
  children: ReactNode;
  /** When true, plays a one-shot emphasis animation */
  flash?: boolean;
  className?: string;
}

export default function LiveScoreUpdater({
  children,
  flash,
  className,
}: LiveScoreUpdaterProps) {
  const prev = useRef(children);
  const [colorFlash, setColorFlash] = useState(false);

  useEffect(() => {
    if (prev.current !== children) {
      prev.current = children;
      setColorFlash(true);
      const t = window.setTimeout(() => setColorFlash(false), 750);
      return () => window.clearTimeout(t);
    }
  }, [children]);

  const active = flash || colorFlash;

  return (
    <span
      className={cn(
        "inline-block tabular-nums transition-colors duration-300",
        active && "text-[var(--color-success)]",
        className
      )}
    >
      {children}
    </span>
  );
}
