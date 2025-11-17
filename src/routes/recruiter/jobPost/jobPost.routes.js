import { Router } from "express";
import { createRecruiterJob } from "../../../controllers/recruiter/jobPost/jobPost.controller.js";
import { validateRequest } from "../../../middlewares/recruiter/validateRecruiter.js";
import { createRecruiterJobSchema } from "../../../validation/recruiter/jobPost/jobPost.validation.js";
import { verifyRecruiterJWT } from "../../../middlewares/recruiter/authRecruiter.js";

const router = Router();

/**
 * POST /api/recruiters/jobs
 * Create a new job posting
 * Requires: Recruiter authentication (JWT token)
 */
router.post(
  "/jobs",
  verifyRecruiterJWT,
  validateRequest(createRecruiterJobSchema),
  createRecruiterJob
);

export default router;

