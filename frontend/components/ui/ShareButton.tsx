"use client";

import { Check, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  matchTitle: string;
  statusLine: string;
}

export default function ShareButton({ matchTitle, statusLine }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = `${matchTitle} — CricScore`;
    const text = statusLine;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled or share failed — no-op
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no-op
    }
  }, [matchTitle, statusLine]);

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      aria-label="Share this match"
      title="Share"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
      )}
    >
      {copied ? (
        <Check className="h-5 w-5" aria-hidden />
      ) : (
        <Share2 className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
