import { Router } from "express";
import * as taskController from "../../modules/tasks/task.controller.js";
import { authMiddleware } from "../../modules/auth/middlewares/auth.middleware.js";
import { validation } from "../../commons/middlewares/validation.middleware.js";
import {
  createTaskValidation,
  updateTaskValidation,
  getTasksValidation,
} from "../../modules/tasks/validations/task.validation.js";
import attachmentRoutes from "./attachment.routes.js";
import checklistRoutes from "./checklist.routes.js";

const router = Router();

// Apply authMiddleware globally to all task routes
router.use(authMiddleware);

// Task CRUD endpoints
router.post("/", validation(createTaskValidation), taskController.createTask);
router.get(
  "/",
  validation(getTasksValidation, "query"),
  taskController.getTasks
);
router.get("/:id", taskController.getTaskById);
router.put("/:id", validation(updateTaskValidation), taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

// Task attachments endpoints
router.use("/:taskId/attachments", attachmentRoutes);

// Task checklist endpoints
router.use("/:taskId/checklist", checklistRoutes);

export default router;
