import { Router } from "express";
import {
  getRecruiterDashboard,
  getRecentJobPosts,
} from "../../../controllers/recruiter/dashboard/dashboard.controller.js";
import { verifyRecruiterJWT } from "../../../middlewares/recruiter/authRecruiter.js";

const router = Router();

/**
 * GET /api/recruiters/dashboard
 * Get recruiter dashboard with job statistics and recent job posts
 * Requires: Recruiter authentication (JWT token)
 */
router.get("/dashboard", verifyRecruiterJWT, getRecruiterDashboard);

/**
 * GET /api/recruiters/recent-jobs
 * Get recent job posts for the authenticated recruiter with pagination
 * Query params: page (default: 1), limit (default: 10, max: 50)
 * Requires: Recruiter authentication (JWT token)
 */
router.get("/recent-jobs", verifyRecruiterJWT, getRecentJobPosts);

export default router;

