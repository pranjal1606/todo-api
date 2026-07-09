import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as attachmentService from "./services/attachment.service.js";
import { AppError } from "../../commons/AppError.js";
import { sendResponse } from "../../commons/response.js";
import fs from "fs";

const getValidatedTaskParams = (req: Request) => {
  const userId = req.user!.id;
  const taskId = Number(req.params.taskId);

  if (isNaN(taskId)) {
    throw new AppError("Invalid task ID", StatusCodes.BAD_REQUEST);
  }

  return { userId, taskId };
};

const getValidatedAttachmentParams = (req: Request) => {
  const userId = req.user!.id;
  const taskId = Number(req.params.taskId);
  const attachmentId = Number(req.params.attachmentId);

  if (isNaN(taskId) || isNaN(attachmentId)) {
    throw new AppError("Invalid IDs", StatusCodes.BAD_REQUEST);
  }

  return { userId, taskId, attachmentId };
};

export const uploadAttachment = async (
  req: Request & { file?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, taskId } = getValidatedTaskParams(req);

    if (!req.file) {
      throw new AppError("No file uploaded", StatusCodes.BAD_REQUEST);
    }

    const updatedTask = await attachmentService.createAttachment(
      userId,
      taskId,
      {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
      }
    );

    sendResponse(res, StatusCodes.OK, {
      data: updatedTask,
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        // ignore errors
      }
    }
    next(error);
  }
};

export const downloadAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, taskId, attachmentId } = getValidatedAttachmentParams(req);

    const attachment = await attachmentService.getAttachmentById(
      userId,
      taskId,
      attachmentId
    );

    if (!fs.existsSync(attachment.path)) {
      throw new AppError("Attachment not found on server disk", StatusCodes.NOT_FOUND);
    }

    res.sendFile(attachment.path);
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, taskId, attachmentId } = getValidatedAttachmentParams(req);

    const updatedTask = await attachmentService.deleteAttachment(
      userId,
      taskId,
      attachmentId
    );

    sendResponse(res, StatusCodes.OK, {
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
