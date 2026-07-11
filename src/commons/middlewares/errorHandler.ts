import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../AppError.js";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error occurred:", err);

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "ValidationError") {
    // Handles validation errors. Usually from: Joi, Mongoose, Zod, class-validator
    // Handling Joi validation errors implicitly if they throw typical validation errors
    statusCode = StatusCodes.BAD_REQUEST;
    message = err.message;
  } else if (err.name === "MulterError") {
    // Handle Multer upload specific errors (like file size limit, unexpected field names)
    statusCode = StatusCodes.BAD_REQUEST;
    if ((err as any).code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum size allowed is 5MB.";
    } else if ((err as any).code === "LIMIT_UNEXPECTED_FILE") {
      if ((err as any).field === "files") {
        message = "Too many files uploaded. Maximum of 5 files allowed.";
      } else if ((err as any).field === "file") {
        message =
          "Too many files uploaded. Only 1 file allowed for this endpoint.";
      } else {
        message =
          "Invalid file upload field name. Please upload using 'file' or 'files'.";
      }
    } else {
      message = err.message;
    }
  }

  res.status(statusCode).json({
    statusCode,
    message,
  });
};
