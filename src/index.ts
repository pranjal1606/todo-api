import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { errorHandler } from "./commons/middlewares/errorHandler.js";
import { globalRateLimiter } from "./commons/middlewares/rateLimiter.middleware.js";

import routes from "./routes/index.js";

dotenv.config();

const app = express();
app.use(express.json());

// Apply the global rate limiter to all requests
app.use(globalRateLimiter);

app.get("/", (req, res) => {
  res.send("To-Do Management API is running");
});

app.use("/", routes);

// Global Error Handling Middleware
// Should be registered after all routes
app.use(errorHandler);

export default app;
