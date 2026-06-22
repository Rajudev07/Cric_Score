type Entry<T> = { value: T; expiresAt: number };

/** Process-local TTL cache for short-lived upstream responses */
export class MemoryTTLCache<T = unknown> {
  private readonly store = new Map<string, Entry<T>>();

  get(key: string): T | undefined {
    const row = this.store.get(key);
    if (!row) return undefined;
    if (Date.now() >= row.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return row.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + Math.max(0, ttlMs) });
  }

  peekEntry(key: string): Entry<T> | undefined {
    return this.store.get(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
