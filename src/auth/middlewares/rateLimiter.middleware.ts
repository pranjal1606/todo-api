import rateLimit from "express-rate-limit";

// Limit repeated login and verify requests to prevent brute-force attacks
export const authRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each client to 3 requests per `windowMs`
  message: {
    status: "fail",
    message:
      "Too many login or verification attempts. Please try again after 24 hours.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
