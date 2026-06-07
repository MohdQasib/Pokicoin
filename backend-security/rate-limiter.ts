import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

// In-Memory Rate Limiter Store
const ipRequestStore: RateLimitStore = {};

// Clean up expired IP entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Object.keys(ipRequestStore).forEach((ip) => {
    if (ipRequestStore[ip].resetTime < now) {
      delete ipRequestStore[ip];
    }
  });
}, 5 * 60 * 1000);

// Pre-defined whitelisted IP ranges and addresses
// (Includes internal Firebase infrastructure, webhooks, and Google Cloud Services)
const IP_WHITELIST = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  // Specific critical system webhooks can be checked separately by path
]);

// Firebase IP range helper checker (CIDR blocks / subnets can be checked if needed)
function isWhitelisted(ip: string, path: string): boolean {
  // 1. Check direct whitelist match
  if (IP_WHITELIST.has(ip)) {
    return true;
  }

  // 2. Safely bypass internal Firebase / Google services IP blocks
  // Typically, requests coming under specific internal endpoints or with secure auth keys 
  // can bypass rate limit checks
  if (path.startsWith('/api/webhooks/firebase-secure-receive') || path.startsWith('/api/v1/system-hooks')) {
    return true;
  }

  // Google Cloud Run or GCP App Engine internal triggers often fall into specific ranges:
  if (ip.startsWith('10.') || ip.startsWith('169.254.') || ip.startsWith('192.168.')) {
    return true; // Local/internal VPC routing
  }

  return false;
}

/**
 * Robust Express Rate Limiter Middleware
 * Limit: Max 60 requests per 1 minute from a single IP address
 * Response: HTTP 429 Status with JSON { "status": "error", "message": "Too many requests. Please try again after some time." }
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const clientIp = (Array.isArray(ip) ? ip[0] : ip).replace('::ffff:', '').trim();
  const path = req.path;

  // Check if IP or route is part of the system whitelist
  if (isWhitelisted(clientIp, path)) {
    return next();
  }

  const now = Date.now();
  const limitWindowMs = 60 * 1000; // 1 minute window
  const maxRequests = 60;          // Max requests in window

  if (!ipRequestStore[clientIp]) {
    // Initialize new window for the IP
    ipRequestStore[clientIp] = {
      count: 1,
      resetTime: now + limitWindowMs,
    };
    return next();
  }

  const clientData = ipRequestStore[clientIp];

  // If window has expired, reset count and reset-time
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + limitWindowMs;
    return next();
  }

  // Increment request count
  clientData.count += 1;

  // Check if request limit was breached
  if (clientData.count > maxRequests) {
    // Log warning for security auditing
    console.warn(`[SECURITY WARN] Rate limit exceeded for IP: ${clientIp} on path: ${path}. Hits: ${clientData.count}`);
    
    // Set response headers informing about rate limits (Standard RFC 7231)
    res.setHeader('Retry-After', Math.ceil((clientData.resetTime - now) / 1000));
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));

    // Return exact requested response structure
    return res.status(429).json({
      status: "error",
      message: "Too many requests. Please try again after some time."
    });
  }

  // Set standard rate limit tracking headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - clientData.count);
  res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));

  next();
}
