import { Router } from "express";
import * as categoryController from "../../categories/category.controller.js";
import { authMiddleware } from "../../auth/middlewares/auth.middleware.js";
import { validation } from "../../commons/middlewares/validation.middleware.js";
import {
  createCategoryValidation,
  updateCategoryValidation,
} from "../../categories/validations/category.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validation(createCategoryValidation),
  categoryController.createCategory
);

router.get("/", categoryController.getCategories);

router.put(
  "/:id",
  validation(updateCategoryValidation),
  categoryController.updateCategory
);

router.delete("/:id", categoryController.deleteCategory);

export default router;
