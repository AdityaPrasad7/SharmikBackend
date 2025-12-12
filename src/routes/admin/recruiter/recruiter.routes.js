import { Router } from "express";
import {
    getRecruiterStats,
    getRecruiterActivity,
} from "../../../controllers/admin/recruiter/recruiter.controller.js";
import { verifyJWT } from "../../../middlewares/authMiddleware.js";

const router = Router();

// Protect all routes with admin authentication
router.use(verifyJWT());

/**
 * @route   GET /api/admin/recruiters/stats
 * @desc    Get recruiter performance stats (Active, Open Positions, Interviews, Hires)
 * @access  Admin
 * @query   startDate, endDate - Optional date range filter
 */
router.get("/stats", getRecruiterStats);

/**
 * @route   GET /api/admin/recruiters/activity
 * @desc    Get recruiter activity snapshot with pagination
 * @access  Admin
 * @query   page, limit - Pagination
 * @query   startDate, endDate - Optional date range filter
 */
router.get("/activity", getRecruiterActivity);

export default router;
