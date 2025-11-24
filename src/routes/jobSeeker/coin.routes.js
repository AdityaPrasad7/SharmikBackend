import { Router } from "express";
import {
  getBalance,
  getTransactions,
  getCoinPackages,
  getCoinPackageById,
  purchaseCoins,
  verifyPayment,
} from "../../controllers/jobSeeker/coin.controller.js";
import { verifyJobSeekerJWT } from "../../middlewares/jobSeeker/authJobSeeker.js";

const router = Router();

// All routes require authentication
router.use(verifyJobSeekerJWT);

// Get coin balance
router.get("/balance", getBalance);

// Get transaction history
router.get("/transactions", getTransactions);

// Get available coin packages
router.get("/packages", getCoinPackages);

// Get a single coin package by ID
router.get("/packages/:packageId", getCoinPackageById);

// Purchase coins (MOCK)
router.post("/purchase", purchaseCoins);

// Verify payment (MOCK)
router.post("/verify-payment", verifyPayment);

export default router;

