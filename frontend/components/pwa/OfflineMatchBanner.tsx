"use client";

import { useEffect, useState } from "react";
import { getOfflineMatchMeta } from "@/lib/pwa/matchViews";

export default function OfflineMatchBanner({ matchId }: { matchId: string }) {
  const [offline, setOffline] = useState(false);
  const [meta, setMeta] = useState<{ at: number } | null>(null);

  useEffect(() => {
    const sync = () => {
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
      setMeta(getOfflineMatchMeta(matchId));
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [matchId]);

  if (!offline || !meta) return null;

  const when = new Date(meta.at).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-2 text-sm text-amber-100">
      You&apos;re offline — showing last updated data from {when}
    </div>
  );
}
