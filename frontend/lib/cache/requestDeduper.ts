const inflight = new Map<string, Promise<unknown>>();

/** Coalesce concurrent identical async work (per-process) */
export function dedupeRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = factory().finally(() => {
    inflight.delete(key);
  }) as Promise<T>;

  inflight.set(key, p);
  return p;
}
