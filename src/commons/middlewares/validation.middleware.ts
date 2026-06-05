import type { Request, Response, NextFunction } from "express";
import type { ObjectSchema } from "joi";
import { AppError } from "../AppError.js";

export const validation = (
  schema: ObjectSchema,
  target: "body" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[target] || {};
    const { error, value } = schema.validate(dataToValidate, {
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
    if (target === "query") {
      for (const key of Object.keys(req.query || {})) {
        delete req.query[key];
      }
      Object.assign(req.query || {}, value || {});
    } else {
      req[target] = value;
    }
    next();
  };
};
