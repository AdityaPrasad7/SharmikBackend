import { Router } from "express";
import {
  createRecruiterJob,
  getAllJobPosts,
  getJobPostById,
  getAllApplicants,
} from "../../controllers/recruiter/jobPost/jobPost.controller.js";
import { validateRequest } from "../../middlewares/recruiter/validateRecruiter.js";
import { createRecruiterJobSchema } from "../../validation/recruiter/jobPost/jobPost.validation.js";
import { verifyRecruiterJWT } from "../../middlewares/recruiter/authRecruiter.js";
import { optionalJobSeekerAuth } from "../../middlewares/jobSeeker/authJobSeeker.js";

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
  validateRequest(createRecruiterJobSchema),
  createRecruiterJob
);

/**
 * GET /api/recruiters/jobs/applicants
 * Get all applicants for jobs posted by the authenticated recruiter
 * Requires: Recruiter authentication (JWT token)
 */
router.get("/jobs/applicants", verifyRecruiterJWT, getAllApplicants);

export default router;

