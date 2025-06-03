interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxEntries?: number;
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

interface CacheStore {
  [key: string]: CacheEntry<any>;
}

class CacheManager {
  private store: CacheStore = {};
  private ttl: number;
  private maxEntries: number;

  constructor(options: CacheOptions) {
    this.ttl = options.ttl;
    this.maxEntries = options.maxEntries || 1000;
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    this.cleanup();

    if (Object.keys(this.store).length >= this.maxEntries) {
      // Remove oldest entry if cache is full
      const oldestKey = Object.keys(this.store).reduce((a, b) =>
        this.store[a].expiry < this.store[b].expiry ? a : b
      );
      delete this.store[oldestKey];
    }

    this.store[key] = {
      data,
      expiry: Date.now() + (customTtl || this.ttl),
    };
  }

  get<T>(key: string): T | null {
    const entry = this.store[key];

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      delete this.store[key];
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.store[key];
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiry) {
      delete this.store[key];
      return false;
    }

    return true;
  }

  delete(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].expiry) {
        delete this.store[key];
      }
    });
  }
}

// Create cache instances for different purposes
export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
});

export const usageStatsCache = new CacheManager({
  ttl: 30 * 1000, // 30 seconds
  maxEntries: 50,
});

export const userDataCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxEntries: 200,
}); 