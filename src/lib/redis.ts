// src/lib/redis.ts
import { Redis } from '@upstash/redis';

// Redis client singleton
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});
