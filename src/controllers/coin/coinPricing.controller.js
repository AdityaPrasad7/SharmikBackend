import { CoinPackage, CoinRule } from "../../models/admin/coinPricing/coinPricing.model.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Get public coin pricing (packages and rules) for a category
 * This endpoint is public and doesn't require authentication
 * Used by frontend to display coin costs and packages
 */
export const getPublicCoinPricing = asyncHandler(async (req, res) => {
  const { category } = req.params;

  // Validate category
  if (!["jobSeeker", "recruiter"].includes(category)) {
    throw new ApiError(400, "Invalid category. Must be 'jobSeeker' or 'recruiter'");
  }

  const [packages, rule] = await Promise.all([
    CoinPackage.find({ category, isVisible: true })
      .sort({ coins: 1 })
      .select("name coins price isVisible")
      .lean(),
    CoinRule.findOne({ category })
      .select("coinCostPerApplication coinCostPerJobPost coinPerEmployeeCount")
      .lean(),
  ]);

  // Format packages
  const formattedPackages = packages.map((pkg) => ({
    id: pkg._id.toString(),
    name: pkg.name,
    coins: pkg.coins,
    price: {
      amount: pkg.price.amount,
      currency: pkg.price.currency || "INR",
    },
  }));

  // Format rules
  const formattedRules = {
    coinCostPerApplication: rule?.coinCostPerApplication ?? 0,
    coinCostPerJobPost: rule?.coinCostPerJobPost ?? 0,
    coinPerEmployeeCount: rule?.coinPerEmployeeCount ?? 0,
  };

  return res.status(200).json(
    ApiResponse.success(
      {
        category,
        packages: formattedPackages,
        rules: formattedRules,
      },
      "Coin pricing retrieved successfully"
    )
  );
});

/**
 * Get coin costs for actions (public endpoint)
 * Returns the cost for posting jobs or applying to jobs
 */
export const getCoinCosts = asyncHandler(async (req, res) => {
  const { category } = req.params;

  // Validate category
  if (!["jobSeeker", "recruiter"].includes(category)) {
    throw new ApiError(400, "Invalid category. Must be 'jobSeeker' or 'recruiter'");
  }

  const rule = await CoinRule.findOne({ category })
    .select("coinCostPerApplication coinCostPerJobPost coinPerEmployeeCount")
    .lean();

  const costs = {
    category,
    // For job seekers
    coinCostPerApplication: category === "jobSeeker" ? (rule?.coinCostPerApplication ?? 0) : 0,
    // For recruiters
    coinCostPerJobPost: category === "recruiter" ? (rule?.coinCostPerJobPost ?? 0) : 0,
    coinPerEmployeeCount: rule?.coinPerEmployeeCount ?? 0,
  };

  return res.status(200).json(
    ApiResponse.success(
      costs,
      "Coin costs retrieved successfully"
    )
  );
});

