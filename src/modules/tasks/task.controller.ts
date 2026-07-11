import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as taskService from "./services/task.service.js";
import * as attachmentService from "./services/attachment.service.js";
import { AppError } from "../../commons/AppError.js";
import { sendResponse } from "../../commons/response.js";
import fs from "fs";
import {
  logUserActivity,
  computeDiff,
} from "../activity_logs/services/activity.service.js";

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const task = await taskService.createTask(userId, req.body);

    const files = req.files as any;
    // Save uploaded files if any
    let savedAttachments: any[] = [];
    if (files && files.length > 0) {
      savedAttachments = await attachmentService.createAttachments(
        task.id,
        files.map((file: any) => ({
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
        }))
      );
    }

    // Retrieve fully loaded task with attachments
    const updatedTask = await taskService.getTaskByIdAndUser(task.id, userId);

    logUserActivity(req, {
      userId,
      action: "TASK_CREATE",
      entityType: "Task",
      entityId: task.id,
      details: { title: task.title, categoryId: task.category?.id || null },
    });

    if (savedAttachments && savedAttachments.length > 0) {
      for (const attachment of savedAttachments) {
        logUserActivity(req, {
          userId,
          action: "ATTACHMENT_UPLOAD",
          entityType: "Attachment",
          entityId: attachment.id,
          details: { filename: attachment.filename, taskId: task.id },
        });
      }
    }

    sendResponse(res, StatusCodes.CREATED, {
      message: "Task created successfully",
      data: updatedTask,
    });
  } catch (error) {
    // Delete any uploaded files if task creation fails
    const files = req.files as any;
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            // ignore cleanup errors
          }
        }
      }
    }
    next(error);
  }
};

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { tasks, pagination } = await taskService.getTasksPaginated(
      userId,
      req.query
    );

    sendResponse(res, StatusCodes.OK, {
      data: tasks,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id as string, 10);

    if (isNaN(taskId)) {
      throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
    }

    const task = await taskService.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    sendResponse(res, StatusCodes.OK, {
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id as string, 10);

    if (isNaN(taskId)) {
      throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
    }

    const oldTask = await taskService.getTaskByIdAndUser(taskId, userId);
    if (!oldTask) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const updatedTask = await taskService.updateTask(taskId, userId, req.body);
    const changes = computeDiff(oldTask, updatedTask);

    logUserActivity(req, {
      userId,
      action: "TASK_UPDATE",
      entityType: "Task",
      entityId: taskId,
      details: { changes },
    });

    sendResponse(res, StatusCodes.OK, {
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id as string, 10);

    if (isNaN(taskId)) {
      throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
    }

    const task = await taskService.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    await taskService.deleteTask(taskId, userId);

    logUserActivity(req, {
      userId,
      action: "TASK_DELETE",
      entityType: "Task",
      entityId: taskId,
      details: { title: task.title },
    });

    sendResponse(res, StatusCodes.OK, {
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
