import { Router } from "express";
import {
  getBalance,
  getTransactions,
  getCoinPackages,
  getCoinPackageById,
  purchaseCoins,
  verifyPayment,
  calculateCoinsForAmount,
  getCoinsPerRupeeRate,
  getMyReferralCode,
  getReferralStats,
} from "../../controllers/recruiter/coin.controller.js";
import { verifyRecruiterJWT } from "../../middlewares/recruiter/authRecruiter.js";

const router = Router();

// All routes require authentication
router.use(verifyRecruiterJWT);

// Get coin balance
router.get("/balance", getBalance);

// Get transaction history
router.get("/transactions", getTransactions);

// Get available coin packages
router.get("/packages", getCoinPackages);

// Get a single coin package by ID
router.get("/packages/:packageId", getCoinPackageById);

// Get coins per rupee rate
router.get("/rate", getCoinsPerRupeeRate);

// Calculate coins for a custom amount
router.get("/calculate", calculateCoinsForAmount);

// Referral APIs
router.get("/referral/my-code", getMyReferralCode);
router.get("/referral/stats", getReferralStats);

// Purchase coins (MOCK)
router.post("/purchase", purchaseCoins);

// Verify payment (MOCK)
router.post("/verify-payment", verifyPayment);

export default router;
