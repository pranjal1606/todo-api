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

export const sendTaskReminder = async (
  to: string,
  taskTitle: string,
  dueDate: Date
) => {
  try {
    const mailOptions = {
      from: '"To-Do API" <noreply@todoapi.com>',
      to,
      subject: `Reminder: Task "${taskTitle}" is due soon`,
      text: `This is a reminder that your task "${taskTitle}" is due on ${dueDate.toLocaleString()}.`,
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">Task Due Reminder</h2>
                <p style="color: #555; font-size: 16px;">This is a reminder that your task <strong>"${taskTitle}"</strong> is due on <strong>${dueDate.toLocaleString()}</strong>.</p>
                <p style="color: #777; font-size: 14px;">Please complete it on time.</p>
            </div>
            `,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending task reminder email:", error);
    throw new Error("Could not send task reminder email.");
  }
};
