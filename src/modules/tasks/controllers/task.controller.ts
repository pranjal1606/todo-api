import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as taskService from "../services/task.service.js";
import { AppError } from "../../../commons/AppError.js";
import { sendResponse } from "../../../commons/response.js";

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
