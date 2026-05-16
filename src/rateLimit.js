import { ApiError } from "./errors.js";

export function createRateLimiter({ enabled, windowMs, maxRequests }) {
  const buckets = new Map();

  return function rateLimit(req, _res, next) {
    if (!enabled) return next();

    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const bucket = buckets.get(key) || { resetAt: now + windowMs, count: 0 };

    if (bucket.resetAt <= now) {
      bucket.resetAt = now + windowMs;
      bucket.count = 0;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      return next(
        new ApiError(429, "rate_limited", "Too many requests. Try again after the rate limit window.", {
          windowMs,
          maxRequests
        })
      );
    }

    return next();
  };
}
