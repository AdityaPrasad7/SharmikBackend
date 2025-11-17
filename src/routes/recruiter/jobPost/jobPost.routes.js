import { Router } from "express";
import {
  createRecruiterJob,
  getAllJobPosts,
} from "../../../controllers/recruiter/jobPost/jobPost.controller.js";
import { validateRequest } from "../../../middlewares/recruiter/validateRecruiter.js";
import { createRecruiterJobSchema } from "../../../validation/recruiter/jobPost/jobPost.validation.js";
import { verifyRecruiterJWT } from "../../../middlewares/recruiter/authRecruiter.js";

const router = Router();

/**
 * GET /api/recruiters/jobs
 * Get all job posts with optional filtering and pagination
 * Public endpoint - no authentication required
 */
router.get("/jobs", getAllJobPosts);

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

