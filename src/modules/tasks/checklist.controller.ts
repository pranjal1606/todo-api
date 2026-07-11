import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as checklistService from "./services/checklist.service.js";
import { AppError } from "../../commons/AppError.js";
import { sendResponse } from "../../commons/response.js";
import { db } from "../../config/database.js";
import { ChecklistItem } from "./entities/ChecklistItem.js";
import {
  logUserActivity,
  computeDiff,
} from "../activity_logs/services/activity.service.js";

/**
 * Helper to extract and validate userId and taskId from the request
 */
const getRequestAuthAndTask = (req: Request) => {
  const userId = req.user!.id;
  const taskId = Number(req.params.taskId || req.params.id);

  if (isNaN(taskId)) {
    throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
  }

  return { userId, taskId };
};

/**
 * Helper to format a checklist item.
 */
const formatChecklistItem = (item: any) => ({
  id: item.id,
  title: item.title,
  isCompleted: item.isCompleted,
});

/**
 * Get checklist items for a task
 */
export const getChecklistItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, taskId } = getRequestAuthAndTask(req);
    const status = (req.query.status as any) || "all";
    const items = await checklistService.getChecklistItems(
      userId,
      taskId,
      status
    );

    sendResponse(res, StatusCodes.OK, {
      data: items.map(formatChecklistItem),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new checklist item to a task
 */
export const createChecklistItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, taskId } = getRequestAuthAndTask(req);
    const { title } = req.body;
    const item = await checklistService.createChecklistItem(
      userId,
      taskId,
      title
    );

    logUserActivity(req, {
      userId,
      action: "CHECKLIST_ITEM_CREATE",
      entityType: "ChecklistItem",
      entityId: item.id,
      details: { title: item.title, taskId },
    });

    sendResponse(res, StatusCodes.CREATED, {
      data: formatChecklistItem(item),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing checklist item
 */
export const updateChecklistItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, taskId } = getRequestAuthAndTask(req);
    const checklistId = Number(req.params.checklistId);

    if (isNaN(checklistId)) {
      throw new AppError("Invalid checklist ID", StatusCodes.BAD_REQUEST);
    }

    const oldItem = await db.getRepository(ChecklistItem).findOne({
      where: { id: checklistId, task: { id: taskId } },
    });

    const updatedItem = await checklistService.updateChecklistItem(
      userId,
      taskId,
      checklistId,
      req.body
    );

    if (oldItem) {
      const changes = computeDiff(oldItem, updatedItem);
      logUserActivity(req, {
        userId,
        action: "CHECKLIST_ITEM_UPDATE",
        entityType: "ChecklistItem",
        entityId: checklistId,
        details: { changes, taskId },
      });
    }

    sendResponse(res, StatusCodes.OK, {
      data: formatChecklistItem(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a checklist item from a task
 */
export const deleteChecklistItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, taskId } = getRequestAuthAndTask(req);
    const checklistId = Number(req.params.checklistId);

    if (isNaN(checklistId)) {
      throw new AppError("Invalid checklist ID", StatusCodes.BAD_REQUEST);
    }

    const item = await db.getRepository(ChecklistItem).findOne({
      where: { id: checklistId, task: { id: taskId } },
    });

    await checklistService.deleteChecklistItem(userId, taskId, checklistId);

    if (item) {
      logUserActivity(req, {
        userId,
        action: "CHECKLIST_ITEM_DELETE",
        entityType: "ChecklistItem",
        entityId: checklistId,
        details: { title: item.title, taskId },
      });
    }

    sendResponse(res, StatusCodes.OK, {
      message: "Checklist item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
