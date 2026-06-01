import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../../config/redis.js";

// Limit repeated login and verify requests to prevent brute-force attacks
export const authRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each client to 3 requests per `windowMs`
  message: {
    message:
      "Too many attempts for this email. Please try again after 24 hours.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },

  // Persist rate limit counts in Redis (survives server restarts)
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      return await redisClient.sendCommand(args);
    },
    prefix: "rl:auth:",
  }),
});
