import rateLimit from "express-rate-limit";

// Limit repeated login and verify requests to prevent brute-force attacks
export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each client to 5 requests per `windowMs`
  message: {
    status: "fail",
    message:
      "Too many login or verification attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
