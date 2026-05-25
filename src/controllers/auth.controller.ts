import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { registerUser, verifyUserOTP, loginUser, rotateRefreshToken, revokeRefreshToken } from "../services/auth/auth.service.js";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const { user, isNewUser } = await registerUser(name, email, password);

    res.status(isNewUser ? StatusCodes.CREATED : StatusCodes.OK).json({
      status: "success",
      message: "User registered successfully. Please check your email for the OTP.",
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

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    await verifyUserOTP(email, otp);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Account verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await loginUser(email, password);

    res.status(StatusCodes.OK).json({
      status: "success",
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

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await rotateRefreshToken(refreshToken);

    if (!tokens) {
      return next(new AppError("Invalid or expired refresh token. Please login again.", StatusCodes.UNAUTHORIZED));
    }

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    await revokeRefreshToken(refreshToken);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
