import { Router } from "express";
import { sendOTP, verifyOTP } from "../../controllers/auth/unifiedAuth.controller.js";
import { validateRequest } from "../../middlewares/auth/validateAuth.js";
import {
  sendOTPSchema,
  verifyOTPSchema,
} from "../../validation/auth/auth.validation.js";

const router = Router();

// Unified OTP Routes - Works for both Job Seekers and Recruiters
// Automatically detects user type based on phone number
router.post(
  "/send-otp",
  validateRequest(sendOTPSchema),
  sendOTP
);

router.post(
  "/verify-otp",
  validateRequest(verifyOTPSchema),
  verifyOTP
);

export default router;

