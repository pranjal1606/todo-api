import { Router } from "express";
import * as checklistController from "../../modules/tasks/checklist.controller.js";
import { authMiddleware } from "../../modules/auth/middlewares/auth.middleware.js";
import { validation } from "../../commons/middlewares/validation.middleware.js";
import {
  addChecklistItemValidation,
  updateChecklistItemApiValidation,
  getChecklistValidation,
} from "../../modules/tasks/validations/checklist.validation.js";

const router = Router({ mergeParams: true });

// Apply authMiddleware globally to all checklist routes
router.use(authMiddleware);

// get checklist items
router.get(
  "/",
  validation(getChecklistValidation, "query"),
  checklistController.getChecklistItems
);

// create checklist item
router.post(
  "/",
  validation(addChecklistItemValidation),
  checklistController.createChecklistItem
);

// update checklist item
router.put(
  "/:checklistId",
  validation(updateChecklistItemApiValidation),
  checklistController.updateChecklistItem
);

// delete checklist item
router.delete("/:checklistId", checklistController.deleteChecklistItem);

export default router;
