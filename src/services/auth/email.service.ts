import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export const sendOTP = async (to: string, otp: string) => {
    try {
        const mailOptions = {
            from: '"To-Do API" <noreply@todoapi.com>',
            to,
            subject: "Your OTP Verification Code",
            text: `Your OTP is ${otp}. It will expire in 1 minute.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">Welcome to To-Do API!</h2>
                <p style="color: #555; font-size: 16px; text-align: center;">Please use the following One-Time Password (OTP) to verify your account. This code is valid for 1 minute.</p>
                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #007bff;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
                </div>
                <p style="color: #777; font-size: 14px; text-align: center;">If you did not request this, please ignore this email.</p>
            </div>
            `,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Could not send verification email.");
    }
};
