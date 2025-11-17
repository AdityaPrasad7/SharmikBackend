import { Router } from "express";
import {
  sendOTP,
  verifyOTP,
  registerRecruiter,
  getRecruiterByPhone,
  refreshRecruiterAccessToken,
  logoutRecruiter,
} from "../../controllers/recruiter/recruiter.controller.js";
import { createRecruiterJob } from "../../controllers/recruiter/recruiterJob.controller.js";
import { getJobMeta } from "../../controllers/recruiter/jobMeta.controller.js";
import { validateRequest } from "../../middlewares/recruiter/validateRecruiter.js";
import {
  sendOTPSchema,
  verifyOTPSchema,
  recruiterRegistrationSchema,
  createRecruiterJobSchema,
} from "../../validation/recruiter/recruiter.validation.js";
import {
  uploadFields,
  uploadToCloudinaryMiddleware,
} from "../../middlewares/fileUpload.js";
import { verifyRecruiterJWT } from "../../middlewares/recruiter/authRecruiter.js";

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
  uploadToCloudinaryMiddleware,
  validateRequest(recruiterRegistrationSchema),
  registerRecruiter
);

// Auth token utilities
router.post("/refresh-token", refreshRecruiterAccessToken);
router.post("/logout", logoutRecruiter);

// Job Meta Data (Public - for job posting form)
router.get("/job-meta", getJobMeta);

// Job Posting
router.post(
  "/jobs",
  verifyRecruiterJWT,
  validateRequest(createRecruiterJobSchema),
  createRecruiterJob
);

// Get Recruiter by Phone
router.get("/:phone", getRecruiterByPhone);

export default router;

