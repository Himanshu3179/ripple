import { NextFunction, Request, Response } from 'express';
interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}

const rateLimit = ({ windowMs, max, keyGenerator }: RateLimitOptions) => {
  const buckets = new Map<string, { count: number; expiresAt: number }>();

  const getKey =
    keyGenerator ??
    ((req: Request) => req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown');

  return (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.expiresAt < now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.expiresAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({ message: 'Too many requests. Please try again later.' });
      return;
    }

    bucket.count += 1;
    next();
  };
};

export default rateLimit;
