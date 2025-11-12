import { Router } from "express";
import {
  sendOTP,
  verifyOTP,
  registerRecruiter,
  getRecruiterByPhone,
} from "../../controllers/recruiter/recruiter.controller.js";
import { validateRequest } from "../../middlewares/recruiter/validateRecruiter.js";
import {
  sendOTPSchema,
  verifyOTPSchema,
  recruiterRegistrationSchema,
} from "../../validation/recruiter/recruiter.validation.js";
import { uploadFields } from "../../middlewares/fileUpload.js";

const router = Router();

// OTP Routes
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

// Recruiter Registration
router.post(
  "/register",
  validateRequest(recruiterRegistrationSchema),
  uploadFields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  registerRecruiter
);

// Get Recruiter by Phone
router.get("/:phone", getRecruiterByPhone);

export default router;

