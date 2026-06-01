import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../../config/database.js";
import { RefreshToken } from "../entities/RefreshToken.js";
import { User } from "../entities/User.js";
import { findUser, saveUserRecord } from "../services/user.service.js";
import { sendOTP } from "../services/email.service.js";
import { AppError } from "../../commons/AppError.js";
import { parseTime } from "../../commons/time.js";
import { StatusCodes } from "http-status-codes";

const refreshTokenRepository = db.getRepository(RefreshToken);

// Common variables to avoid repetitive process.env calls
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY;
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY;

// Single initialization-time security configurations validation
if (!JWT_ACCESS_SECRET || JWT_ACCESS_SECRET.length < 32) {
  throw new Error("Access token secret is not securely configured");
}
if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  throw new Error("Refresh token secret is not securely configured");
}

export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digits
};

export const generateJWT = (user: User) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      accessExp: JWT_ACCESS_EXPIRY,
      refreshExp: JWT_REFRESH_EXPIRY,
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRY as any,
      algorithm: "HS256",
    }
  );
};

// Helper function to keep hashing logic in one place
const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateRefreshToken = async (user: User) => {
  try {
    // Generate signed JWT Refresh Token (no nested jti per feedback)
    const refreshTokenStr = jwt.sign(
      { id: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRY as any,
        algorithm: "HS256",
      }
    );

    const refreshExpiryMs =
      parseTime(JWT_REFRESH_EXPIRY) || 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + refreshExpiryMs);
    const tokenHash = hashToken(refreshTokenStr); // Hash the entire JWT string

    const tokenRecord = refreshTokenRepository.create({
      user,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    await refreshTokenRepository.save(tokenRecord);
    return refreshTokenStr;
  } catch (error) {
    throw error;
  }
};

export const rotateRefreshToken = async (oldRefreshToken: string) => {
  try {
    // 1. Verify the incoming JWT refresh token signature and expiration
    try {
      jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return null; // Invalid or expired JWT
    }

    // 2. Hash the raw JWT string to find the database whitelist record
    const oldTokenHash = hashToken(oldRefreshToken);

    const record = await refreshTokenRepository.findOne({
      where: { token_hash: oldTokenHash },
      relations: { user: true },
    });

    // 3. CHECK REVOKED (Breach detection)
    if (record && record.revoked_at) {
      const revokedTime = new Date(record.revoked_at).getTime();
      const now = Date.now();
      const gracePeriod = 30 * 1000;
      if (now - revokedTime < gracePeriod) {
        return null;
      }
      // Breach detection: Revoke all tokens for this user
      await refreshTokenRepository.update(
        { user: { id: record.user.id } },
        { revoked_at: new Date() }
      );
      console.warn(
        `SECURITY ALERT: Token reuse detected for user ${record.user.id}. All sessions revoked.`
      );
      return null;
    }

    if (!record || new Date(record.expires_at) < new Date()) {
      return null;
    }

    // Revoke old token
    record.revoked_at = new Date();
    await refreshTokenRepository.save(record);

    // Fetch fresh user data (ensures they aren't deleted)
    const user = await findUser({ id: record.user.id });
    if (!user) return null;

    // Generate new Access Token + Rotated JWT Refresh Token
    const newRefreshTokenStr = await generateRefreshToken(user);
    const accessToken = generateJWT(user);

    return {
      accessToken,
      refreshToken: newRefreshTokenStr,
    };
  } catch (error) {
    throw error;
  }
};

export const revokeRefreshToken = async (refreshToken: string) => {
  try {
    try {
      // Verify validity before database search
      jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      const tokenHash = hashToken(refreshToken);
      const record = await refreshTokenRepository.findOne({
        where: { token_hash: tokenHash },
      });

      if (record && !record.revoked_at) {
        record.revoked_at = new Date();
        await refreshTokenRepository.save(record);
      }
    } catch (error) {
      // If verification fails, ignore
    }
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  try {
    const existingUser = await findUser({ email });

    if (existingUser?.isVerified) {
      throw new AppError("Email already exists", StatusCodes.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(
      Date.now() + parseTime(process.env.OTP_EXPIRY)
    );

    let user;
    const userPayload = {
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiresAt,
    };

    if (existingUser) {
      user = await saveUserRecord({
        ...existingUser,
        ...userPayload,
      });
    } else {
      user = await saveUserRecord(userPayload);
    }

    await sendOTP(user.email, otp);
    return { user, isNewUser: !existingUser };
  } catch (error) {
    throw error;
  }
};

export const verifyUserOTP = async (email: string, otp: string) => {
  try {
    const user = await findUser({ email });
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    if (user.isVerified) {
      throw new AppError("User is already verified", StatusCodes.BAD_REQUEST);
    }

    if (
      user.otp !== otp ||
      !user.otpExpiresAt ||
      new Date() > user.otpExpiresAt
    ) {
      throw new AppError("Invalid or expired OTP", StatusCodes.BAD_REQUEST);
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await saveUserRecord(user);
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const user = await findUser({ email });
    if (!user || user.deletedAt) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    if (!user.isVerified) {
      throw new AppError(
        "Please verify your email before logging in",
        StatusCodes.FORBIDDEN
      );
    }

    const accessToken = generateJWT(user);
    const refreshToken = await generateRefreshToken(user);

    return { accessToken, refreshToken, user };
  } catch (error) {
    throw error;
  }
};
