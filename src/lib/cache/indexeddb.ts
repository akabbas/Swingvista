const DB_NAME = 'swingvista-cache';
const DB_VERSION = 2; // bump to invalidate old cache
const STORE_POSES = 'poses';
const STORE_ANALYSIS = 'analysis';
const APP_VERSION = '2.0.0'; // Add app version for cache busting

export interface CachedItem<T> {
  key: string; // content hash
  value: T;
  size: number; // bytes approx
  createdAt: number;
  lastAccessedAt: number;
  appVersion?: string; // Add app version for validation
}

export interface LruConfig {
  maxBytes: number; // e.g., 100MB
}

const DEFAULT_LRU: LruConfig = { maxBytes: 100 * 1024 * 1024 };

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_POSES)) {
        const store = db.createObjectStore(STORE_POSES, { keyPath: 'key' });
        store.createIndex('lastAccessedAt', 'lastAccessedAt');
      }
      if (!db.objectStoreNames.contains(STORE_ANALYSIS)) {
        const store = db.createObjectStore(STORE_ANALYSIS, { keyPath: 'key' });
        store.createIndex('lastAccessedAt', 'lastAccessedAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function estimateSize(obj: unknown): Promise<number> {
  try {
    // Rough JSON size estimate
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
}

async function getTotalBytes(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []) as CachedItem<any>[];
      resolve(items.reduce((sum, it) => sum + (it.size || 0), 0));
    };
    req.onerror = () => reject(req.error);
  });
}

async function evictLru(db: IDBDatabase, storeName: string, config: LruConfig) {
  const total = await getTotalBytes(db, storeName);
  if (total <= config.maxBytes) return;

  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const index = store.index('lastAccessedAt');
  const toDelete: string[] = [];
  const req = index.openCursor();
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null;
      if (!cursor) return resolve();
      const item = cursor.value as CachedItem<any>;
      toDelete.push(item.key);
      // keep deleting until under limit (approximate)
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
  for (const key of toDelete) {
    await new Promise<void>((resolve, reject) => {
      const delTx = db.transaction(storeName, 'readwrite');
      const s = delTx.objectStore(storeName);
      const d = s.delete(key);
      d.onsuccess = () => resolve();
      d.onerror = () => reject(d.error);
    });
    const nowTotal = await getTotalBytes(db, storeName);
    if (nowTotal <= DEFAULT_LRU.maxBytes) break;
  }
}

export async function getCachedPoses<T = any>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_POSES, 'readwrite');
    const store = tx.objectStore(STORE_POSES);
    const req = store.get(key);
    req.onsuccess = () => {
      const item = req.result as CachedItem<T> | undefined;
      if (!item) return resolve(null);
      item.lastAccessedAt = Date.now();
      store.put(item);
      resolve(item.value);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function setCachedPoses<T = any>(key: string, value: T, lru: LruConfig = DEFAULT_LRU): Promise<void> {
  const db = await openDb();
  const size = await estimateSize(value);
  await evictLru(db, STORE_POSES, lru);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_POSES, 'readwrite');
    const store = tx.objectStore(STORE_POSES);
    const item: CachedItem<T> = { 
      key, 
      value, 
      size, 
      createdAt: Date.now(), 
      lastAccessedAt: Date.now(),
      appVersion: APP_VERSION
    };
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedAnalysis<T = any>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYSIS, 'readwrite');
    const store = tx.objectStore(STORE_ANALYSIS);
    const req = store.get(key);
    req.onsuccess = () => {
      const item = req.result as CachedItem<T> | undefined;
      if (!item) return resolve(null);
      item.lastAccessedAt = Date.now();
      store.put(item);
      resolve(item.value);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function setCachedAnalysis<T = any>(key: string, value: T, lru: LruConfig = DEFAULT_LRU): Promise<void> {
  const db = await openDb();
  const size = await estimateSize(value);
  await evictLru(db, STORE_ANALYSIS, lru);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYSIS, 'readwrite');
    const store = tx.objectStore(STORE_ANALYSIS);
    const item: CachedItem<T> = { 
      key, 
      value, 
      size, 
      createdAt: Date.now(), 
      lastAccessedAt: Date.now(),
      appVersion: APP_VERSION
    };
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export const CacheSchema = {
  appVersion: '2.0.0',
  schemaVersion: DB_VERSION,
};

// Cache validation functions
export function validateCachedPoses(poses: any[]): boolean {
  if (!Array.isArray(poses)) return false;
  if (poses.length < 5) return false; // Minimum poses required
  
  // Check if poses have required structure
  return poses.every(pose => 
    pose && 
    typeof pose === 'object' && 
    Array.isArray(pose.landmarks) && 
    pose.landmarks.length > 0 &&
    typeof pose.timestamp === 'number'
  );
}

export function validateCachedAnalysis(analysis: any): boolean {
  if (!analysis || typeof analysis !== 'object') return false;
  
  // Check for required analysis properties
  return !!(
    analysis.swingId &&
    analysis.metrics &&
    analysis.phases &&
    Array.isArray(analysis.phases)
  );
}

export function isCacheValid<T>(item: CachedItem<T> | null, validator?: (value: T) => boolean): boolean {
  if (!item) return false;
  
  // Check app version compatibility
  if (item.appVersion && item.appVersion !== APP_VERSION) {
    console.log('Cache item from different app version, invalidating');
    return false;
  }
  
  // Check age (7 days max)
  const age = Date.now() - item.createdAt;
  if (age > 7 * 24 * 60 * 60 * 1000) {
    console.log('Cache item too old, invalidating');
    return false;
  }
  
  // Run custom validator if provided
  if (validator && !validator(item.value)) {
    console.log('Cache item failed validation, invalidating');
    return false;
  }
  
  return true;
}

// Clear all cache data
export async function clearAllCache(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([STORE_POSES, STORE_ANALYSIS], 'readwrite');
  
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const req = tx.objectStore(STORE_POSES).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }),
    new Promise<void>((resolve, reject) => {
      const req = tx.objectStore(STORE_ANALYSIS).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })
  ]);
  
  console.log('All cache data cleared');
}


