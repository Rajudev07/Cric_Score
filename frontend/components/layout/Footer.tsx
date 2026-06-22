"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function Footer() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onBip = () => setCanInstall(true);
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const onInstall = useCallback(
    (e: React.MouseEvent) => {
      if (!canInstall) return;
      e.preventDefault();
      window.dispatchEvent(new Event("cricscore:request-install"));
    },
    [canInstall]
  );

  return (
    <footer className="hidden border-t-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] px-6 py-8 md:block">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-zinc-600 dark:text-zinc-400">
          <Link href="/schedule" className="hover:text-[var(--color-brand)]">
            Schedule
          </Link>
          <span aria-hidden>·</span>
          <Link href="/about" className="hover:text-[var(--color-brand)]">
            About
          </Link>
          <span aria-hidden>·</span>
          {canInstall ? (
            <button
              type="button"
              onClick={onInstall}
              className="hover:text-[var(--color-brand)]"
            >
              Install App
            </button>
          ) : (
            <Link href="/about" className="hover:text-[var(--color-brand)]">
              Install App
            </Link>
          )}
        </div>
        <p className="text-center text-[12px] text-[var(--color-text-secondary)]">
          Data sourced from CricketData.org — Not affiliated with Cricbuzz or BCCI
        </p>
        <p className="text-center text-[11px] text-[var(--color-text-secondary)]">
          © 2025 CricScore · Free cricket scores, live updates, and match coverage
        </p>
      </div>
    </footer>
  );
}
