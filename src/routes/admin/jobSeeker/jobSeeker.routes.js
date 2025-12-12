import { Router } from "express";
import {
    getJobSeekerStats,
    getTopJobSeekers,
    getJobSeekerCategories,
} from "../../../controllers/admin/jobSeeker/jobSeeker.controller.js";
import { verifyJWT } from "../../../middlewares/authMiddleware.js";

const router = Router();

// Protect all routes with admin authentication
router.use(verifyJWT());

/**
 * @route   GET /api/admin/job-seekers/stats
 * @desc    Get job seeker insights stats (Active Profiles, Interviews, Offers, Skills)
 * @access  Admin
 * @query   startDate, endDate - Optional date range filter
 */
router.get("/stats", getJobSeekerStats);

/**
 * @route   GET /api/admin/job-seekers/top
 * @desc    Get top job seekers with pagination and filtering
 * @access  Admin
 * @query   page, limit - Pagination
 * @query   category - Filter by category
 * @query   startDate, endDate - Optional date range filter
 */
router.get("/top", getTopJobSeekers);

/**
 * @route   GET /api/admin/job-seekers/categories
 * @desc    Get list of categories for filter dropdown
 * @access  Admin
 */
router.get("/categories", getJobSeekerCategories);

export default router;
