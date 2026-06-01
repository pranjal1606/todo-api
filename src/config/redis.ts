import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Initialize Redis client using environment URL or local fallback
export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

// Establish connection asynchronously
redisClient
  .connect()
  .then(() => {
    console.log("Redis database connected successfully");
  })
  .catch((err) => {
    console.error("Redis database connection failed:", err);
  });
