import { Router } from "express";
import { getAvailableRoles } from "../../controllers/role/role.controller.js";

const router = Router();

// Get Available Roles (Public endpoint)
router.get("/", getAvailableRoles);

export default router;

