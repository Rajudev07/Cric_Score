"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  dismissInstallPrompt,
  getMatchViewCount,
  isInstallDismissed,
} from "@/lib/pwa/matchViews";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pending = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const maybeShow = useCallback(() => {
    if (isInstallDismissed()) return;
    if (getMatchViewCount() < 3) return;
    if (pending.current) {
      setDeferred(pending.current);
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      pending.current = e as BeforeInstallPromptEvent;
      maybeShow();
    };
    window.addEventListener("beforeinstallprompt", onBip);
    maybeShow();
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, [maybeShow]);

  useEffect(() => {
    const onViews = () => maybeShow();
    window.addEventListener("cricscore:match-view", onViews);
    return () => window.removeEventListener("cricscore:match-view", onViews);
  }, [maybeShow]);

  useEffect(() => {
    const onRequest = () => {
      const prompt = pending.current ?? deferred;
      if (!prompt) return;
      setDeferred(prompt);
      setVisible(true);
    };
    window.addEventListener("cricscore:request-install", onRequest);
    return () => window.removeEventListener("cricscore:request-install", onRequest);
  }, [deferred]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDeferred(null);
    dismissInstallPrompt();
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* user cancelled */
    } finally {
      setDeferred(null);
      setVisible(false);
      dismissInstallPrompt();
    }
  }, [deferred]);

  if (!visible || !deferred) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[150] border-t border-violet-900/50 bg-zinc-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md">
        <p className="text-sm font-semibold text-violet-100">Install CricScore</p>
        <p className="mt-1 text-xs text-violet-200/90">
          Quick access and a fuller-screen live experience.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            size="sm"
            className="min-h-[44px] flex-1 bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]"
            onClick={install}
          >
            Install
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-[44px] text-violet-100 hover:bg-violet-900/40"
            onClick={dismiss}
          >
            Not now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-violet-900/50 bg-violet-950/35 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 text-center text-sm text-violet-100">
        <span className="font-medium">Install CricScore</span>
        <span className="text-violet-200/90">
          for quick access and a fuller-screen live experience.
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="sm"
            className="min-h-[44px] bg-[var(--color-brand)] px-4 text-white hover:bg-[var(--color-brand-dark)]"
            onClick={install}
          >
            Install
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-[44px] text-violet-100 hover:bg-violet-900/40"
            onClick={dismiss}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
