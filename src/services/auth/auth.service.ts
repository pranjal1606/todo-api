import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../../config/database.js";
import { RefreshToken } from "../../entities/RefreshToken.js";
import { User } from "../../entities/User.js";
import { findUserById, findUserByEmail, createUserRecord, updateUserRecord } from "./user.service.js";
import { sendOTP } from "./email.service.js";
import { AppError } from "../../utils/AppError.js";
import { StatusCodes } from "http-status-codes";


const refreshTokenRepository = db.getRepository(RefreshToken);

export const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString(); // 6 digits
};


export const generateJWT = (user: User) => {
    if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
        throw new Error("Access token secret is not securely configured");
    }
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "1h",
            algorithm: "HS256",
        }
    );
};


export const generateRefreshToken = async (user: User) => {
    const refreshTokenStr = crypto.randomBytes(64).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(refreshTokenStr).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const tokenRecord = refreshTokenRepository.create({
        user,
        token_hash: tokenHash,
        expires_at: expiresAt,
    });
    await refreshTokenRepository.save(tokenRecord);
    return refreshTokenStr;
};


export const rotateRefreshToken = async (oldRefreshToken: string) => {
    const oldTokenHash = crypto.createHash("sha256").update(oldRefreshToken).digest("hex");
    const record = await refreshTokenRepository.findOne({
        where: { token_hash: oldTokenHash },
        relations: { user: true },
    });
    if (record && record.revoked_at) {
        const revokedTime = new Date(record.revoked_at).getTime();
        const now = Date.now();
        const gracePeriod = 30 * 1000;
        if (now - revokedTime < gracePeriod) {
            return null;
        }
        // Breach detection: Revoke all tokens for this user
        await refreshTokenRepository.update({ user: { id: record.user.id } }, { revoked_at: new Date() });
        console.warn(`SECURITY ALERT: Token reuse detected for user ${record.user.id}. All sessions revoked.`);
        return null;
    }
    if (!record || new Date(record.expires_at) < new Date()) {
        return null;
    }
    // Create new token
    const newRefreshTokenStr = crypto.randomBytes(64).toString("hex");
    const newTokenHash = crypto.createHash("sha256").update(newRefreshTokenStr).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // Revoke old token
    record.revoked_at = new Date();
    await refreshTokenRepository.save(record);
    // Insert new token
    const newTokenRecord = refreshTokenRepository.create({
        user: record.user,
        token_hash: newTokenHash,
        expires_at: expiresAt,
    });
    await refreshTokenRepository.save(newTokenRecord);
    // Generate new Access Token
    const user = await findUserById(record.user.id);
    if (!user) return null;
    const accessToken = generateJWT(user);
    return {
        accessToken,
        refreshToken: newRefreshTokenStr,
    };
};


export const revokeRefreshToken = async (refreshToken: string) => {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const record = await refreshTokenRepository.findOne({
        where: { token_hash: tokenHash },
    });
    if (record && !record.revoked_at) {
        record.revoked_at = new Date();
        await refreshTokenRepository.save(record);
    }
};


export const registerUser = async (name: string, email: string, password: string) => {
    const existingUser = await findUserByEmail(email);
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

    let user;

    if (existingUser) {
        if (existingUser.isVerified) {
            throw new AppError("Email already exists", StatusCodes.CONFLICT);
        }
        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.otp = otp;
        existingUser.otpExpiresAt = otpExpiresAt;
        user = await updateUserRecord(existingUser);
    } else {
        user = await createUserRecord({
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            otp,
            otpExpiresAt,
        });
    }

    await sendOTP(user.email, otp);
    return { user, isNewUser: !existingUser };
};

export const verifyUserOTP = async (email: string, otp: string) => {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    if (user.isVerified) {
        throw new AppError("User is already verified", StatusCodes.BAD_REQUEST);
    }

    if (user.otp !== otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        throw new AppError("Invalid or expired OTP", StatusCodes.BAD_REQUEST);
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await updateUserRecord(user);
};

export const loginUser = async (email: string, password: string) => {
    const user = await findUserByEmail(email);
    if (!user || user.deletedAt) {
        throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    if (!user.isVerified) {
        throw new AppError("Please verify your email before logging in", StatusCodes.FORBIDDEN);
    }

    const accessToken = generateJWT(user);
    const refreshToken = await generateRefreshToken(user);

    return { accessToken, refreshToken, user };
};