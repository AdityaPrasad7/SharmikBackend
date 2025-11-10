// src/routes/index.js
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "API root is working 🚀" });
});

export default router;
