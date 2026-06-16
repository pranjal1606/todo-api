import { db } from "../../config/database.js";
import { Task } from "../../modules/tasks/entities/Task.js";
import { sendTaskReminder } from "../../modules/tasks/services/email.service.js";
import { LessThanOrEqual, Not } from "typeorm";

export const startReminderJob = () => {
  console.log("Background Task reminder job scheduler started.");

  const runJob = async () => {
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
        take: 100,
      });

      await Promise.all(
        pendingReminders.map(async (task) => {
          const email = task.user?.email;
          if (!email) return;
          try {
            await sendTaskReminder(
              email,
              task.title,
              task.dueDate || new Date()
            );
            task.reminderSent = true;
            await taskRepository.save(task);
          } catch (err) {
            console.error(`Reminder failed for task ${task.id}:`, err);
          }
        })
      );
    } catch (error) {
      console.error("Error in reminder job poller:", error);
    } finally {
      // Schedule the next check 60 seconds after the current run completes
      setTimeout(runJob, 60000);
    }
  };

  // Trigger the first execution
  setTimeout(runJob, 60000);
};
