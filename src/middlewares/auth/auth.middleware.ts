import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../utils/AppError.js";
import { findUserById } from "../../services/auth/user.service.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError("Unauthorized - No token provided", StatusCodes.UNAUTHORIZED)
    );
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(
      new AppError("Unauthorized - Invalid token", StatusCodes.UNAUTHORIZED)
    );
  }

  try {
    if (
      !process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_ACCESS_SECRET.length < 32
    ) {
      return next(
        new AppError(
          "Server configuration error",
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as {
      id: number;
      email: string;
    };

    const user = await findUserById(decoded.id);

    if (!user || user.deletedAt) {
      return next(
        new AppError(
          "Unauthorized - User not found or deleted",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    return next(
      new AppError(
        "Unauthorized - Invalid or expired token",
        StatusCodes.UNAUTHORIZED
      )
    );
  }
};
