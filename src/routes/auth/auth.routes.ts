import express from "express";
import * as authController from "../../modules/auth/controllers/auth.controller.js";
import { authMiddleware } from "../../modules/auth/middlewares/auth.middleware.js";
import { validation } from "../../commons/middlewares/validation.middleware.js";
import {
  regValidation,
  loginValidation,
  refreshValidation,
  verifyValidation,
} from "../../modules/auth/validations/auth.validation.js";

import { authRateLimiter } from "../../modules/auth/middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  validation(regValidation),
  authController.register
);
router.post("/verify", validation(verifyValidation), authController.verifyOTP);
router.post("/login", validation(loginValidation), authController.login);
router.post("/refresh", validation(refreshValidation), authController.refresh);
router.post("/logout", validation(refreshValidation), authController.logout);
router.get("/profile", authMiddleware, authController.getProfile);

export default router;
