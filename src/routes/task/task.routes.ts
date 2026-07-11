import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
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
import { upload } from "../../modules/tasks/attachment.middleware.js";

const router = Router();

// Middleware to parse fields from multipart/form-data before Joi validation
const parseMultipartBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    if (typeof req.body.categoryId === "string") {
      const catId = Number(req.body.categoryId);
      if (!isNaN(catId)) {
        req.body.categoryId = catId;
      }
    }
    if (
      typeof req.body.checklistItems === "string" &&
      req.body.checklistItems.trim().startsWith("[")
    ) {
      try {
        req.body.checklistItems = JSON.parse(req.body.checklistItems);
      } catch (e) {
        // Let Joi validate the malformed array structure
      }
    }
  }
  next();
};

// Apply authMiddleware globally to all task routes
router.use(authMiddleware);

// Task CRUD endpoints
router.post(
  "/",
  upload.array("files", 5), // Allow up to 5 files
  parseMultipartBody,
  validation(createTaskValidation),
  taskController.createTask
);
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
