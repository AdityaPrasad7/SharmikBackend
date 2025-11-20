import { Router } from "express";
import { getAllSkills } from "../../controllers/skills/skills.controller.js";

const router = Router();

/**
 * GET /api/skills
 * Get all unique skills from all specializations
 * Public endpoint - no authentication required
 */
router.get("/", getAllSkills);

export default router;


