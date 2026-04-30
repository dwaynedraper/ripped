import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function makeRatelimit(redis: Redis, requests: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    ephemeralCache: new Map(),
  });
}

const redis = makeRedis();

// Per-IP: 20 requests per 10 seconds on the webhook endpoint.
// Clerk signature verification is the primary guard; this is defense-in-depth.
export const webhookRatelimit = redis
  ? makeRatelimit(redis, 20, "10 s")
  : null;

// Per-user: 15 vote attempts per minute.
// The DB unique constraint is the primary guard; this limits brute-force attempts.
export const voteRatelimit = redis
  ? makeRatelimit(redis, 15, "1 m")
  : null;
