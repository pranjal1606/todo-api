import app from "./index.js";
import { db } from "./config/database.js";
import { startReminderJob } from "./commons/jobs/reminder.job.js";

const PORT = process.env.PORT;

// Initialize Database connection then start server
db.initialize()
  .then(() => {
    console.log("Database connected successfully");

    // Start background task reminder poller
    startReminderJob();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
