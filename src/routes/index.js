// src/routes/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import specializationRoutes from "./admin/specialization/specialization.routes.js";
import questionSetRoutes from "./admin/questionSet/questionSet.routes.js";
import coinPricingRoutes from "./admin/coinPricing/coinPricing.routes.js";
import categoryRoutes from "./admin/category/category.routes.js";
import jobSeekerRoutes from "./jobSeeker/jobSeeker.routes.js";
import recruiterRoutes from "./recruiter/recruiter.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "API root is working 🚀" });
});

router.use("/api/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/specializations", specializationRoutes);
router.use("/api/question-sets", questionSetRoutes);
router.use("/api/coin-pricing", coinPricingRoutes);
router.use("/api/categories", categoryRoutes);
router.use("/api/job-seekers", jobSeekerRoutes);
router.use("/api/recruiters", recruiterRoutes);

export default router;
