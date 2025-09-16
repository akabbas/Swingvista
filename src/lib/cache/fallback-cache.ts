// Fallback cache system using localStorage when IndexedDB fails
import { CachedItem, LruConfig } from './indexeddb';

const STORAGE_PREFIX = 'swingvista_cache_';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for localStorage

export class FallbackCache {
  private static instance: FallbackCache;
  private memoryCache = new Map<string, CachedItem<any>>();
  private maxMemoryItems = 50; // Limit memory cache size

  static getInstance(): FallbackCache {
    if (!FallbackCache.instance) {
      FallbackCache.instance = new FallbackCache();
    }
    return FallbackCache.instance;
  }

  private getStorageKey(key: string, type: 'poses' | 'analysis'): string {
    return `${STORAGE_PREFIX}${type}_${key}`;
  }

  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getStorageSize(): number {
    if (!this.isStorageAvailable()) return 0;
    
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += value.length;
        }
      }
    }
    return total;
  }

  private evictOldestFromStorage(): void {
    if (!this.isStorageAvailable()) return;

    const items: { key: string; lastAccessed: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const item = JSON.parse(value) as CachedItem<any>;
            items.push({ key, lastAccessed: item.lastAccessedAt });
          }
        } catch {
          // Skip invalid items
        }
      }
    }

    // Sort by last accessed time (oldest first)
    items.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove oldest items until under limit
    for (const item of items) {
      localStorage.removeItem(item.key);
      if (this.getStorageSize() < MAX_STORAGE_SIZE * 0.8) break;
    }
  }

  async get<T = any>(key: string, type: 'poses' | 'analysis'): Promise<T | null> {
    // Try memory cache first
    const memoryKey = `${type}_${key}`;
    if (this.memoryCache.has(memoryKey)) {
      const item = this.memoryCache.get(memoryKey)!;
      item.lastAccessedAt = Date.now();
      console.log(`Fallback cache hit (memory): ${type}`, key);
      return item.value;
    }

    // Try localStorage
    if (this.isStorageAvailable()) {
      try {
        const storageKey = this.getStorageKey(key, type);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const item = JSON.parse(stored) as CachedItem<T>;
          item.lastAccessedAt = Date.now();
          
          // Store in memory cache
          this.memoryCache.set(memoryKey, item);
          if (this.memoryCache.size > this.maxMemoryItems) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
          }
          
          console.log(`Fallback cache hit (localStorage): ${type}`, key);
          return item.value;
        }
      } catch (error) {
        console.warn('Fallback cache localStorage read error:', error);
      }
    }

    console.log(`Fallback cache miss: ${type}`, key);
    return null;
  }

  async set<T = any>(key: string, value: T, type: 'poses' | 'analysis'): Promise<void> {
    const item: CachedItem<T> = {
      key,
      value,
      size: JSON.stringify(value).length,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      appVersion: '2.0.0'
    };

    // Store in memory cache
    const memoryKey = `${type}_${key}`;
    this.memoryCache.set(memoryKey, item);
    if (this.memoryCache.size > this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    // Store in localStorage if available
    if (this.isStorageAvailable()) {
      try {
        // Check if we need to evict
        if (this.getStorageSize() > MAX_STORAGE_SIZE) {
          this.evictOldestFromStorage();
        }

        const storageKey = this.getStorageKey(key, type);
        localStorage.setItem(storageKey, JSON.stringify(item));
        console.log(`Fallback cache stored: ${type}`, key);
      } catch (error) {
        console.warn('Fallback cache localStorage write error:', error);
      }
    }
  }

  clear(): void {
    this.memoryCache.clear();
    
    if (this.isStorageAvailable()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('Fallback cache cleared');
      } catch (error) {
        console.warn('Fallback cache clear error:', error);
      }
    }
  }
}

// Wrapper functions that try IndexedDB first, then fallback
export async function getCachedPosesFallback<T = any>(key: string): Promise<T | null> {
  try {
    const { getCachedPoses } = await import('./indexeddb');
    return await getCachedPoses<T>(key);
  } catch (error) {
    console.warn('IndexedDB failed, using fallback cache:', error);
    const fallback = FallbackCache.getInstance();
    return await fallback.get<T>(key, 'poses');
  }
}

export async function setCachedPosesFallback<T = any>(key: string, value: T): Promise<void> {
  try {
    const { setCachedPoses } = await import('./indexeddb');
    await setCachedPoses(key, value);
  } catch (error) {
    console.warn('IndexedDB failed, using fallback cache:', error);
    const fallback = FallbackCache.getInstance();
    await fallback.set(key, value, 'poses');
  }
}

export async function getCachedAnalysisFallback<T = any>(key: string): Promise<T | null> {
  try {
    const { getCachedAnalysis } = await import('./indexeddb');
    return await getCachedAnalysis<T>(key);
  } catch (error) {
    console.warn('IndexedDB failed, using fallback cache:', error);
    const fallback = FallbackCache.getInstance();
    return await fallback.get<T>(key, 'analysis');
  }
}

export async function setCachedAnalysisFallback<T = any>(key: string, value: T): Promise<void> {
  try {
    const { setCachedAnalysis } = await import('./indexeddb');
    await setCachedAnalysis(key, value);
  } catch (error) {
    console.warn('IndexedDB failed, using fallback cache:', error);
    const fallback = FallbackCache.getInstance();
    await fallback.set(key, value, 'analysis');
  }
}
