import { Router } from "express";
import { login } from "../controllers/admin/auth/adminAuth.controller.js";

const router = Router();

router.post("/login", login);

export default router;

