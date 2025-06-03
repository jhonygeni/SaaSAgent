import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface SecurityConfig {
  webhookSecret: string;
  rateLimits: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
  };
}

const DEFAULT_CONFIG: SecurityConfig = {
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  rateLimits: {
    windowMs: 60000, // 1 minute
    maxRequests: 30  // 30 requests per minute
  },
  cors: {
    allowedOrigins: ['https://sua-aplicacao.vercel.app'],
    allowedMethods: ['POST', 'GET', 'OPTIONS']
  }
};

// Rate limiting storage
const rateLimitStore = new Map<string, number[]>();

// Validate webhook signature
export function validateWebhookSignature(
  req: Request,
  res: Response,
  next: NextFunction,
  config: SecurityConfig = DEFAULT_CONFIG
) {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    // Require signature and timestamp
    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Missing security headers' });
    }

    // Verify timestamp is recent (within 5 minutes)
    const timestampMs = parseInt(timestamp as string, 10);
    if (isNaN(timestampMs) || Date.now() - timestampMs > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Invalid timestamp' });
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(`${timestamp}:${payload}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Security check failed' });
  }
}

// Rate limiting middleware
export function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
  config: SecurityConfig = DEFAULT_CONFIG
) {
  const clientId = req.headers['x-client-id'] as string || req.ip;
  const now = Date.now();
  
  // Get existing calls for this client
  const calls = rateLimitStore.get(clientId) || [];
  
  // Remove old calls outside the window
  const recentCalls = calls.filter(time => time > now - config.rateLimits.windowMs);
  
  // Check if limit exceeded
  if (recentCalls.length >= config.rateLimits.maxRequests) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // Add current call
  recentCalls.push(now);
  rateLimitStore.set(clientId, recentCalls);
  
  next();
}

// CORS middleware
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  config: SecurityConfig = DEFAULT_CONFIG
) {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (origin && config.cors.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', config.cors.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-ID, X-Webhook-Signature, X-Webhook-Timestamp');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
}

// Security headers middleware
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
}

// Combined security middleware
export function securityMiddleware(config: SecurityConfig = DEFAULT_CONFIG) {
  return [
    corsMiddleware,
    securityHeaders,
    rateLimit,
    (req: Request, res: Response, next: NextFunction) => 
      validateWebhookSignature(req, res, next, config)
  ];
} 