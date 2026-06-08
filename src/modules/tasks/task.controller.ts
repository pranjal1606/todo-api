import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as taskService from "./services/task.service.js";
import { AppError } from "../../commons/AppError.js";
import { sendResponse } from "../../commons/response.js";
import { db } from "../../config/database.js";
import { Attachment } from "./entities/Attachment.js";
import fs from "fs";

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const task = await taskService.createTask(userId, req.body);

    sendResponse(res, StatusCodes.CREATED, {
      data: task,
    });
  } catch (error) {
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
    const { tasks, meta } = await taskService.getTasksPaginated(
      userId,
      req.query
    );

    sendResponse(res, StatusCodes.OK, {
      data: tasks,
      meta,
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

    const updatedTask = await taskService.updateTask(taskId, userId, req.body);

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

    await taskService.deleteTask(taskId, userId);

    sendResponse(res, StatusCodes.OK, {
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAttachment = async (
  req: Request & { file?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.id as string, 10);

    if (isNaN(taskId)) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
    }

    if (!req.file) {
      throw new AppError("No file uploaded", StatusCodes.BAD_REQUEST);
    }

    const task = await taskService.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const attachmentRepository = db.getRepository(Attachment);
    await attachmentRepository.save({
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      task: { id: taskId },
    });

    const updatedTask = await taskService.getTaskByIdAndUser(taskId, userId);

    sendResponse(res, StatusCodes.OK, {
      data: updatedTask,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        // ignore errors
      }
    }
    next(error);
  }
};

export const deleteAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.taskId as string, 10);
    const attachmentId = parseInt(req.params.attachmentId as string, 10);

    if (isNaN(taskId) || isNaN(attachmentId)) {
      throw new AppError("Invalid IDs", StatusCodes.BAD_REQUEST);
    }

    const task = await taskService.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const attachmentRepository = db.getRepository(Attachment);
    const attachment = await attachmentRepository.findOne({
      where: { id: attachmentId, task: { id: taskId } },
    });

    if (!attachment) {
      throw new AppError("Attachment not found", StatusCodes.NOT_FOUND);
    }

    // Delete physically
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    await attachmentRepository.delete(attachmentId);

    const updatedTask = await taskService.getTaskByIdAndUser(taskId, userId);

    sendResponse(res, StatusCodes.OK, {
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const taskId = parseInt(req.params.taskId as string, 10);
    const attachmentId = parseInt(req.params.attachmentId as string, 10);

    if (isNaN(taskId) || isNaN(attachmentId)) {
      throw new AppError("Invalid IDs", StatusCodes.BAD_REQUEST);
    }

    const task = await taskService.getTaskByIdAndUser(taskId, userId);
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const attachmentRepository = db.getRepository(Attachment);
    const attachment = await attachmentRepository.findOne({
      where: { id: attachmentId, task: { id: taskId } },
    });

    if (!attachment || !fs.existsSync(attachment.path)) {
      throw new AppError("Attachment not found", StatusCodes.NOT_FOUND);
    }

    res.sendFile(attachment.path);
  } catch (error) {
    next(error);
  }
};
