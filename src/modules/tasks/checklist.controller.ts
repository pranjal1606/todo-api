import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as checklistService from "./services/checklist.service.js";
import { AppError } from "../../commons/AppError.js";
import { sendResponse } from "../../commons/response.js";

/**
 * Get checklist items for a task
 */
export const getChecklistItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt((req.params.id || req.params.taskId) as string, 10);

    if (isNaN(taskId)) {
      throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
    }

    const status = (req.query.status as any) || "all";
    const items = await checklistService.getChecklistItems(
      userId,
      taskId,
      status
    );

    sendResponse(res, StatusCodes.OK, {
      data: items,
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
    const userId = req.user!.id;
    const taskId = parseInt((req.params.id || req.params.taskId) as string, 10);

    if (isNaN(taskId)) {
      throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
    }

    const { title } = req.body;
    const item = await checklistService.createChecklistItem(
      userId,
      taskId,
      title
    );

    sendResponse(res, StatusCodes.CREATED, {
      data: item,
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
    const userId = req.user!.id;
    const taskId = parseInt(req.params.taskId as string, 10);
    const checklistId = parseInt(req.params.checklistId as string, 10);

    if (isNaN(taskId) || isNaN(checklistId)) {
      throw new AppError("Invalid IDs provided", StatusCodes.BAD_REQUEST);
    }

    const updatedItem = await checklistService.updateChecklistItem(
      userId,
      taskId,
      checklistId,
      req.body
    );

    sendResponse(res, StatusCodes.OK, {
      data: updatedItem,
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
    const userId = req.user!.id;
    const taskId = parseInt(req.params.taskId as string, 10);
    const checklistId = parseInt(req.params.checklistId as string, 10);

    if (isNaN(taskId) || isNaN(checklistId)) {
      throw new AppError("Invalid IDs provided", StatusCodes.BAD_REQUEST);
    }

    await checklistService.deleteChecklistItem(userId, taskId, checklistId);

    sendResponse(res, StatusCodes.OK, {
      message: "Checklist item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
