import rateLimit from "express-rate-limit";
import { SqlStore } from "./SqlStore.js";

// Limit repeated login and verify requests to prevent brute-force attacks
export const authRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each client to 3 requests per `windowMs`
  message: {
    statusCode: 429,
    message:
      "Too many attempts for this email. Please try again after 24 hours.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },

  // Persist rate limit counts in the PostgreSQL database otps table
  store: new SqlStore(),
});
