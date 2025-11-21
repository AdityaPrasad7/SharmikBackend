import { Router } from "express";
import {
  getPublicCoinPricing,
  getCoinCosts,
} from "../../controllers/coin/coinPricing.controller.js";

const router = Router();

// Public endpoints - no authentication required
// Get coin pricing (packages + rules) for a category
router.get("/:category", getPublicCoinPricing);

// Get coin costs for actions
router.get("/:category/costs", getCoinCosts);

export default router;

