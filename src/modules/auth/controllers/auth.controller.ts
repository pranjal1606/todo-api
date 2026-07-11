import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../commons/AppError.js";
import { sendResponse } from "../../../commons/response.js";
import {
  registerUser,
  verifyUserOTP,
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
} from "../services/auth.service.js";
import { findUser } from "../services/user.service.js";
import { logUserActivity } from "../../activity_logs/services/activity.service.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const { user, isNewUser } = await registerUser(name, email, password);

    logUserActivity(req, {
      userId: user.id,
      action: isNewUser ? "USER_REGISTER" : "USER_OTP_RESEND",
      entityType: "User",
      entityId: user.id,
    });

    sendResponse(res, isNewUser ? StatusCodes.CREATED : StatusCodes.OK, {
      message: isNewUser
        ? "User registered successfully. Please check your email for the OTP."
        : "OTP resent successfully. Please check your email.",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    await verifyUserOTP(email, otp);

    const user = await findUser({ email });
    if (user) {
      logUserActivity(req, {
        userId: user.id,
        action: "USER_VERIFY_OTP",
        entityType: "User",
        entityId: user.id,
      });
    }

    sendResponse(res, StatusCodes.OK, {
      message: "Account verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await loginUser(
      email,
      password
    );

    logUserActivity(req, {
      userId: user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email },
    });

    sendResponse(res, StatusCodes.OK, {
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await rotateRefreshToken(refreshToken);

    if (!tokens) {
      return next(
        new AppError(
          "Invalid or expired refresh token. Please login again.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    sendResponse(res, StatusCodes.OK, {
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;
    const user = await revokeRefreshToken(refreshToken);

    if (user) {
      logUserActivity(req, {
        userId: user.id,
        action: "USER_LOGOUT",
        entityType: "User",
        entityId: user.id,
      });
    }

    sendResponse(res, StatusCodes.OK, {
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
    }

    const user = await findUser({ id: userId });
    if (!user || user.deletedAt) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    sendResponse(res, StatusCodes.OK, {
      message: "User profile retrieved successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
