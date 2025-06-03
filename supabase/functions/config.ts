import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from './_shared/cors';

// Define KVNamespace type if not available
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

// Rate limiting configuration
const RATE_LIMIT = {
  WINDOW_MS: 60000, // 1 minute
  MAX_REQUESTS: {
    DEFAULT: 60,
    USAGE_STATS: 30,
    REALTIME: 120,
  },
};

// Cache configuration
const CACHE_CONFIG = {
  TTL: {
    DEFAULT: 300, // 5 minutes
    USAGE_STATS: 30, // 30 seconds
    USER_DATA: 900, // 15 minutes
  },
  HEADERS: {
    CACHE_CONTROL: 'public, max-age=',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate=',
  },
};

// Error messages
const ERROR_MESSAGES = {
  RATE_LIMIT: 'Too many requests. Please try again later.',
  UNAUTHORIZED: 'Unauthorized access.',
  INVALID_REQUEST: 'Invalid request parameters.',
};

// Helper function to check rate limit
export async function checkRateLimit(
  req: Request,
  context: { env: { USAGE_STATS_KV: KVNamespace } },
  type: keyof typeof RATE_LIMIT.MAX_REQUESTS = 'DEFAULT'
): Promise<boolean> {
  const clientIP = req.headers.get('cf-connecting-ip') || 'unknown';
  const key = `rate_limit:${type}:${clientIP}`;
  
  try {
    const currentRequests = await context.env.USAGE_STATS_KV.get(key);
    const requests = currentRequests ? parseInt(currentRequests) : 0;

    if (requests >= RATE_LIMIT.MAX_REQUESTS[type]) {
      return false;
    }

    await context.env.USAGE_STATS_KV.put(
      key,
      (requests + 1).toString(),
      { expirationTtl: RATE_LIMIT.WINDOW_MS / 1000 }
    );

    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow request if rate limit check fails
  }
}

// Helper function to set cache headers
export function setCacheHeaders(
  res: Response,
  type: keyof typeof CACHE_CONFIG.TTL = 'DEFAULT'
): Response {
  const ttl = CACHE_CONFIG.TTL[type];
  const headers = new Headers(res.headers);
  
  headers.set(
    'Cache-Control',
    `${CACHE_CONFIG.HEADERS.CACHE_CONTROL}${ttl}, ${CACHE_CONFIG.HEADERS.STALE_WHILE_REVALIDATE}${ttl}`
  );

  return new Response(res.body, {
    status: res.status,
    headers,
  });
}

// Helper function to create error response
export function createErrorResponse(
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

// Helper function to validate request
export function validateRequest(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Export constants and configurations
export {
  RATE_LIMIT,
  CACHE_CONFIG,
  ERROR_MESSAGES,
  corsHeaders,
}; 