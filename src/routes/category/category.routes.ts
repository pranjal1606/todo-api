import { Router } from "express";
import * as categoryController from "../../controllers/category/category.controller.js";
import { authMiddleware } from "../../middlewares/auth/auth.middleware.js";
import { validation } from "../../middlewares/validation.middleware.js";
import {
  createCategoryValidation,
  updateCategoryValidation,
} from "../../validations/category/category.validation.js";

const router = Router();

router.use(authMiddleware);

router.post("/", validation(createCategoryValidation), categoryController.createCategory);

router.get("/", categoryController.getCategories);

router.put("/:id", validation(updateCategoryValidation), categoryController.updateCategory);

router.delete("/:id", categoryController.deleteCategory);

export default router;
