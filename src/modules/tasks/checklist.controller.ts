import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as checklistService from "./services/checklist.service.js";
import { AppError } from "../../commons/AppError.js";
import { sendResponse } from "../../commons/response.js";

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

    const updatedItem = await checklistService.updateChecklistItem(
      userId,
      taskId,
      checklistId,
      req.body
    );

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

    await checklistService.deleteChecklistItem(userId, taskId, checklistId);

    sendResponse(res, StatusCodes.OK, {
      message: "Checklist item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
