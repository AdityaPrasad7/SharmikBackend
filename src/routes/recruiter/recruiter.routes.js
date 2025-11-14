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
  uploadFields([
    { name: "companyLogo", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  validateRequest(recruiterRegistrationSchema),
  registerRecruiter
);

// Get Recruiter by Phone
router.get("/:phone", getRecruiterByPhone);

export default router;

