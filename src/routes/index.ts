import { Router } from "express";
import authRoutes from "./auth/auth.routes.js";
import categoryRoutes from "./category/category.routes.js";
import taskRoutes from "./task/task.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/tasks", taskRoutes);

export default router;
