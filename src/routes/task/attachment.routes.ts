import { Router } from "express";
import * as attachmentController from "../../modules/tasks/attachment.controller.js";
import { authMiddleware } from "../../modules/auth/middlewares/auth.middleware.js";
import { upload } from "../../modules/tasks/attachment.middleware.js";

const router = Router({ mergeParams: true });

// Apply authMiddleware globally to all attachment routes
router.use(authMiddleware);

// Upload attachment
router.post("/", upload.single("file"), attachmentController.uploadAttachment);

// Download attachment
router.get("/:attachmentId", attachmentController.downloadAttachment);

// Delete attachment
router.delete("/:attachmentId", attachmentController.deleteAttachment);

export default router;
