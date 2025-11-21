import { Router } from "express";
import {
  getBalance,
  getTransactions,
  getCoinPackages,
  purchaseCoins,
  verifyPayment,
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

// Purchase coins (MOCK)
router.post("/purchase", purchaseCoins);

// Verify payment (MOCK)
router.post("/verify-payment", verifyPayment);

export default router;

