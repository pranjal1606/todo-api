import { db } from "../../../config/database.js";
import { ActivityLog } from "../entities/ActivityLog.js";
import type { Request } from "express";

const getActivityLogRepository = () => db.getRepository(ActivityLog);

export interface LogActivityParams {
  userId?: number | null | undefined;
  action: string;
  entityType?: string | null | undefined;
  entityId?: number | null | undefined;
  details?: any;
}

export interface FullLogActivityParams extends LogActivityParams {
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}

export const logActivity = async (params: FullLogActivityParams) => {
  try {
    const repository = getActivityLogRepository();
    const log = repository.create({
      userId: params.userId || null,
      action: params.action,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });
    await repository.save(log);
  } catch (error) {
    console.error("Failed to save activity log:", error);
  }
};

/**
 * Compare two objects and return a diff of changed scalar properties
 * This function compares the properties of two objects (e.g., a Task before and after it was updated) and generates a JSON audit log representation.
 */
export const computeDiff = (oldObj: any, newObj: any) => {
  const changes: Record<string, { old: any; new: any }> = {};

  // If either object is missing, return empty changes immediately.
  if (!oldObj || !newObj) return changes;

  // Combine keys of both objects
  // It creates a combined Set of all property names present in either of the two objects with no duplicates.
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  // Exclude system fields, sensitive info, and relations from diff calculation
  const ignoreKeys = new Set([
    "createdAt",
    "updatedAt",
    "deletedAt",
    "id",
    "password",
    "otp",
    "otpExpiresAt",
    "refreshTokens",
    "categories",
    "tasks",
    "attachments",
    "checklistItems",
    "user",
    "task",
    "category",
  ]);

  for (const key of keys) {
    if (ignoreKeys.has(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Ignore functions and complex object relations (e.g. model instances)
    if (typeof oldVal === "function" || typeof newVal === "function") {
      continue;
    }

    // It skips nested objects, arrays, and functions (focusing only on simple datatypes like strings, numbers, booleans, and dates).
    // Ignore nested custom objects/relations that are not Date instances
    // only log simple text/number fields.
    const isOldObj =
      oldVal && typeof oldVal === "object" && !(oldVal instanceof Date);
    const isNewObj =
      newVal && typeof newVal === "object" && !(newVal instanceof Date);
    if (isOldObj || isNewObj) {
      continue;
    }

    if (oldVal !== newVal) {
      // Format Dates to string for reliable comparison
      // It compares Date values by converting them to standard ISO string representations (.toISOString()) to avoid false positives.
      const oldStr = oldVal instanceof Date ? oldVal.toISOString() : oldVal;
      const newStr = newVal instanceof Date ? newVal.toISOString() : newVal;

      if (oldStr !== newStr) {
        changes[key] = {
          old: oldVal === undefined ? null : oldVal,
          new: newVal === undefined ? null : newVal,
        };
      }
    }
  }

  return changes;
};

/**
 * Common helper to log user activity automatically extracting IP and User-Agent from Request
 */
export const logUserActivity = (req: Request, params: LogActivityParams) => {
  void logActivity({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });
};
