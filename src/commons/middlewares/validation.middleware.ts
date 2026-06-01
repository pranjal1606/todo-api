import type { Request, Response, NextFunction } from "express";
import type { ObjectSchema } from "joi";
import { AppError } from "../AppError.js";

export const validation = (
  schema: ObjectSchema,
  target: "body" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
    });

    if (error) {
      // Map all validation error messages into a single string or array (here we use a single string)
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      const appError = new AppError(errorMessage, 400);
      appError.name = "ValidationError";
      return next(appError);
    }

    // Apply Joi's transformations (like .trim(), default values, etc) back to the request
    req[target] = value;
    next();
  };
};
