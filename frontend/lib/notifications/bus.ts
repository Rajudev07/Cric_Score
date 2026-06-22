import type { CricketLiveEvent } from "@/lib/notifications/types";

type Listener = (event: CricketLiveEvent) => void;

const listeners = new Set<Listener>();

export function subscribeLiveCricketEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitLiveCricketEvent(event: CricketLiveEvent): void {
  for (const l of listeners) {
    try {
      l(event);
    } catch {
      /* consumer error — isolate */
    }
  }
}
