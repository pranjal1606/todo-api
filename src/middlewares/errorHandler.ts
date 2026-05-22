import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";

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
  }

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message
  });
};
