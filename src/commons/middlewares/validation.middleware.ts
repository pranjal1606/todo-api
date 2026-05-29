import type { Request, Response, NextFunction } from "express";
import type { ObjectSchema } from "joi";
import { AppError } from "../utils/AppError.js";

export const validation = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      // Map all validation error messages into a single string or array (here we use a single string)
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      const appError = new AppError(errorMessage, 400);
      appError.name = "ValidationError";
      return next(appError);
    }

    next();
  };
};
