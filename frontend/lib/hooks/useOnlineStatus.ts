"use client";

import { useEffect, useRef, useState } from "react";

export function useConnectivity(): {
  online: boolean;
  justReconnected: boolean;
  dismissReconnect: () => void;
} {
  const [online, setOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);
  const sawOffline = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const onOffline = () => {
      sawOffline.current = true;
      setOnline(false);
    };

    const onOnline = () => {
      setOnline(true);
      if (sawOffline.current) {
        sawOffline.current = false;
        setJustReconnected(true);
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          setJustReconnected(false);
          timerRef.current = null;
        }, 5000);
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearTimer();
    };
  }, []);

  return {
    online,
    justReconnected,
    dismissReconnect: () => {
      setJustReconnected(false);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
  };
}
