"use client";

import { useConnectivity } from "@/lib/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";

export default function ConnectivityBar() {
  const { online, justReconnected, dismissReconnect } = useConnectivity();

  if (justReconnected) {
    return (
      <div
        role="status"
        className="border-b border-emerald-900/50 bg-emerald-950/40 px-4 py-2.5 text-center text-sm text-emerald-100 sm:px-6"
      >
        <span className="font-medium">Back online</span>
        <span className="text-emerald-200/90"> — refreshing feeds.</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-3 h-9 min-h-[44px] px-3 text-emerald-100 hover:bg-emerald-900/40 hover:text-white"
          onClick={dismissReconnect}
        >
          Dismiss
        </Button>
      </div>
    );
  }

  if (!online) {
    return (
      <div
        role="alert"
        className="border-b border-amber-900/50 bg-amber-950/35 px-4 py-2.5 text-center text-sm text-amber-100 sm:px-6"
      >
        <span className="font-semibold">Offline mode</span>
        <span className="text-amber-100/85">
          {" "}
          — showing cached data where available. Live scores resume when you reconnect.
        </span>
      </div>
    );
  }

  return null;
}
