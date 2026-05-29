import express from "express";
import * as authController from "../../auth/controllers/auth.controller.js";
import { validation } from "../../commons/middlewares/validation.middleware.js";
import {
  regValidation,
  loginValidation,
  refreshValidation,
  verifyValidation,
} from "../../auth/validations/auth.validation.js";

import { authRateLimiter } from "../../auth/middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, validation(regValidation), authController.register);
router.post("/verify", validation(verifyValidation), authController.verifyOTP);
router.post("/login", validation(loginValidation), authController.login);
router.post("/refresh", validation(refreshValidation), authController.refresh);
router.post("/logout", validation(refreshValidation), authController.logout);

export default router;
