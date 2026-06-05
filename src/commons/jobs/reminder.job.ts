import { db } from "../../config/database.js";
import { Task } from "../../modules/tasks/entities/Task.js";
import { sendTaskReminder } from "../../modules/tasks/services/email.service.js";
import { LessThanOrEqual, Not } from "typeorm";

export const startReminderJob = () => {
  console.log("Background Task reminder job scheduler started.");

  setInterval(async () => {
    try {
      const taskRepository = db.getRepository(Task);
      const now = new Date();

      // Find tasks where reminderAt is reached, reminder hasn't been sent, and task is not completed
      const pendingReminders = await taskRepository.find({
        where: {
          reminderSent: false,
          reminderAt: LessThanOrEqual(now),
          status: Not("COMPLETED"),
        },
        relations: {
          user: true,
        },
      });

      for (const task of pendingReminders) {
        if (task.user && task.user.email) {
          try {
            await sendTaskReminder(
              task.user.email,
              task.title,
              task.dueDate || new Date()
            );

            // Mark reminder as sent to avoid double execution
            task.reminderSent = true;
            await taskRepository.save(task);
            console.log(
              `Reminder email sent to ${task.user.email} for task ID: ${task.id}`
            );
          } catch (emailError) {
            console.error(
              `Error sending reminder email for task ID ${task.id}:`,
              emailError
            );
          }
        }
      }
    } catch (error) {
      console.error("Error in reminder job poller:", error);
    }
  }, 60000); // Check every 60 seconds
};
