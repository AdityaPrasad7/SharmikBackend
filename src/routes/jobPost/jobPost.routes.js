import { Router } from "express";
import {
  createRecruiterJob,
  getAllJobPosts,
  getJobPostById,
  updateVacancyCount,
  deactivateJob,
} from "../../controllers/recruiter/jobPost/jobPost.controller.js";
import { validateRequest } from "../../middlewares/recruiter/validateRecruiter.js";
import { createRecruiterJobSchema } from "../../validation/recruiter/jobPost/jobPost.validation.js";
import { verifyRecruiterJWT } from "../../middlewares/recruiter/authRecruiter.js";
import { optionalJobSeekerAuth } from "../../middlewares/jobSeeker/authJobSeeker.js";
import { ensureRecruiterProfileComplete } from "../../middlewares/recruiter/ensureProfileComplete.js";

const router = Router();

/**
 * GET /api/recruiters/jobs
 * Get all job posts with optional filtering and pagination
 * Public endpoint - but if job seeker is authenticated, filters by their category
 */
router.get("/jobs", optionalJobSeekerAuth, getAllJobPosts);

/**
 * GET /api/recruiters/jobs/:id
 * Get a specific job post by ID
 * Public endpoint - no authentication required
 */
router.get("/jobs/:id", getJobPostById);

/**
 * POST /api/recruiters/jobs
 * Create a new job posting
 * Requires: Recruiter authentication (JWT token)
 */
router.post(
  "/jobs",
  verifyRecruiterJWT,
  ensureRecruiterProfileComplete,
  validateRequest(createRecruiterJobSchema),
  createRecruiterJob
);

/**
 * PATCH /api/recruiters/jobs/:jobId/vacancy-count
 * Update vacancy count for a job post
 * Body: { vacancyCount: number }
 * Requires: Recruiter authentication (JWT token)
 */
router.patch("/jobs/:jobId/vacancy-count", verifyRecruiterJWT, updateVacancyCount);

/**
 * PATCH /api/recruiters/jobs/:jobId/deactivate
 * Manually deactivate/close a job post
 * Requires: Recruiter authentication (JWT token)
 */
router.patch("/jobs/:jobId/deactivate", verifyRecruiterJWT, deactivateJob);

export default router;

