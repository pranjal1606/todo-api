import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { validation } from "../middlewares/validation.middleware.js";
import {
  regValidation,
  loginValidation,
  refreshValidation,
  verifyValidation,
} from "../validations/auth.validation.js";

import { authRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/register", validation(regValidation), authController.register);
router.post(
  "/verify",
  authRateLimiter,
  validation(verifyValidation),
  authController.verifyOTP
);
router.post(
  "/login",
  authRateLimiter,
  validation(loginValidation),
  authController.login
);
router.post("/refresh", validation(refreshValidation), authController.refresh);
router.post("/logout", validation(refreshValidation), authController.logout);

export default router;
