interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimiterStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimiterStore = {};
  private maxRequests: number;
  private windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.store[key];

    if (!record) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return false;
    }

    if (now > record.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return false;
    }

    if (record.count >= this.maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  getRemainingRequests(key: string): number {
    const record = this.store[key];
    if (!record) {
      return this.maxRequests;
    }

    if (Date.now() > record.resetTime) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(key: string): number {
    const record = this.store[key];
    if (!record) {
      return Date.now() + this.windowMs;
    }
    return record.resetTime;
  }

  reset(key: string): void {
    delete this.store[key];
  }

  resetAll(): void {
    this.store = {};
  }
}

// Create rate limiter instances for different purposes
export const apiRateLimiter = new RateLimiter({
  maxRequests: 60, // 60 requests
  windowMs: 60 * 1000, // per minute
});

export const realtimeRateLimiter = new RateLimiter({
  maxRequests: 120, // 120 events
  windowMs: 60 * 1000, // per minute
});

export const usageStatsRateLimiter = new RateLimiter({
  maxRequests: 30, // 30 requests
  windowMs: 60 * 1000, // per minute
}); 