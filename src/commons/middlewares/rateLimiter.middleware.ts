import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../../config/redis.js";

// Global rate limiter to protect the application from DDoS and excessive requests
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs`
  message: {
    message:
      "Too many requests from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  // Persist rate limit counts in Redis (survives server restarts)
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      return await redisClient.sendCommand(args);
    },
    prefix: "rl:global:",
  }),
});
