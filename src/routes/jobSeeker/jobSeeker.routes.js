import { Router } from "express";
import {
  sendOTP,
  verifyOTP,
  registerNonDegree,
  step1Registration,
  step2Registration,
  step3Registration,
  getCategories,
  getAllSpecializations,
  getSpecializationSkills,
  getSkillsByCategory,
  getJobSeekerByPhone,
  refreshAccessToken,
  logoutJobSeeker,
} from "../../controllers/jobSeeker/jobSeeker.controller.js";
import { validateRequest } from "../../middlewares/jobSeeker/validateJobSeeker.js";
import {
  sendOTPSchema,
  verifyOTPSchema,
  nonDegreeRegistrationSchema,
  step1RegistrationSchema,
  step2RegistrationSchema,
  step3RegistrationSchema,
  getSpecializationSkillsSchema,
  getSkillsByCategorySchema,
} from "../../validation/jobSeeker/jobSeeker.validation.js";
import { uploadFields, uploadToCloudinaryMiddleware } from "../../middlewares/fileUpload.js";

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

// Non-Degree Holder Registration (Complete in one step)
router.post(
  "/register/non-degree",
  uploadFields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  uploadToCloudinaryMiddleware, // Upload files to Cloudinary
  (req, res, next) => {
    // Debug: Log what multer received
    console.log("After multer - req.body:", req.body);
    console.log("After multer - req.files:", req.files);
    console.log("After multer - req.body keys:", Object.keys(req.body || {}));
    next();
  },
  validateRequest(nonDegreeRegistrationSchema),
  registerNonDegree
);

// Diploma/ITI Holder Registration - Step 1
router.post(
  "/register/step1",
  uploadFields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  uploadToCloudinaryMiddleware, // Upload files to Cloudinary
  validateRequest(step1RegistrationSchema),
  step1Registration
);

// Diploma/ITI Holder Registration - Step 2
router.post(
  "/register/step2",
  validateRequest(step2RegistrationSchema),
  step2Registration
);

// Diploma/ITI Holder Registration - Step 3
router.post(
  "/register/step3",
  uploadFields([
    { name: "resume", maxCount: 1 },
    { name: "experienceCertificate", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  uploadToCloudinaryMiddleware, // Upload files to Cloudinary
  validateRequest(step3RegistrationSchema),
  step3Registration
);

// Get Available Categories (Public - for registration)
router.get("/categories", getCategories);

// Get All Specializations (Public - for registration) - Must be before /:phone route
router.get("/specializations", getAllSpecializations);

// Get Specialization with Skills and Questions - Must be before /:phone route
router.get(
  "/specialization/:specializationId",
  validateRequest(getSpecializationSkillsSchema, "params"),
  getSpecializationSkills
);

// Get Skills by Category (for Non-Degree/Diploma/ITI registration) - Must be before /:phone route
router.get(
  "/skills-by-category",
  validateRequest(getSkillsByCategorySchema, "query"),
  getSkillsByCategory
);

// Refresh Token Route (Public - no auth required)
router.post("/refresh-token", refreshAccessToken);

// Logout Route (Public - no auth required, but should send refresh token)
router.post("/logout", logoutJobSeeker);

// Get Job Seeker by Phone - Must be last to avoid route conflicts
router.get("/phone/:phone", getJobSeekerByPhone);

export default router;

