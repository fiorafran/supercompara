import type { SearchResult } from "./scrapers/types";

const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  data: SearchResult;
  expiresAt: number;
}

// Module-level singleton — persists across requests in same process
const store = new Map<string, CacheEntry>();

export function cacheGet(key: string): SearchResult | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key: string, data: SearchResult): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

export function cacheClear(): void {
  store.clear();
}
