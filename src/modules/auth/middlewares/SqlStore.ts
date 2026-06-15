import type { Store, Options, IncrementResponse } from "express-rate-limit";
import { db } from "../../../config/database.js";

// In-memory fallback map for emails/keys that do not exist in the database yet
// Temporary backup for users who haven't created an account yet
const memoryStore = new Map<string, { hits: number; resetAt: Date }>();

export class SqlStore implements Store {
  windowMs!: number;

  // called automatically by express-rate-limit. Stores the window duration so the store knows how long to block for.
  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  // Called on every request. Increments the request count for the given key (email).
  // Returns the number of hits and the time at which the rate limit window resets.
  async increment(key: string): Promise<IncrementResponse> {
    const now = new Date();
    const resetAt = new Date(Date.now() + this.windowMs);

    // Atomic single SQL UPDATE query for high performance and single DB roundtrip
    const result = await db.query(
      `
      UPDATE "users"
      SET 
        "requests" = CASE 
          WHEN "resetAt" IS NULL OR "resetAt" <= $2 THEN 1 
          ELSE "requests" + 1 
        END,
        "resetAt" = CASE 
          WHEN "resetAt" IS NULL OR "resetAt" <= $2 THEN $3 
          ELSE "resetAt" 
        END
      WHERE "email" = $1
      RETURNING "requests", "resetAt"
      `,
      [key, now, resetAt]
    );

    const rows = result?.[0];
    if (rows?.[0]) {
      return {
        totalHits: rows[0].requests,
        resetTime: new Date(rows[0].resetAt),
      };
    }

    // Fallback if user does not exist in DB (first signup attempt)
    const record = memoryStore.get(key) || { hits: 0, resetAt };
    const hits = record.resetAt <= now ? 1 : record.hits + 1;
    const expiry = record.resetAt <= now ? resetAt : record.resetAt;
    memoryStore.set(key, { hits, resetAt: expiry });

    return { totalHits: hits, resetTime: expiry };
  }

  // Called when the rate limit window resets. Decrements the request count for the given key (email).
  async decrement(key: string): Promise<void> {
    const result = await db.query(
      `UPDATE "users" SET "requests" = GREATEST("requests" - 1, 0) WHERE "email" = $1`,
      [key]
    );
    // If user does not exist, result is empty or count (result[1]) is 0, decrement memory store fallback
    if (!result?.[1]) {
      const record = memoryStore.get(key);
      if (record && record.hits > 0) record.hits--;
    }
  }

  // Resets the request count for the given key (email) and resetAt as NULL.
  async resetKey(key: string): Promise<void> {
    const result = await db.query(
      `UPDATE "users" SET "requests" = 0, "resetAt" = NULL WHERE "email" = $1`,
      [key]
    );
    if (!result?.[1]) memoryStore.delete(key);
  }
}
