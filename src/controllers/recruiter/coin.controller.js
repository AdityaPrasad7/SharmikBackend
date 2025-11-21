import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getCoinBalance,
  checkCoinBalance,
  addCoins,
  getTransactionHistory,
} from "../../services/coin/coinService.js";
import { CoinPackage } from "../../models/admin/coinPricing/coinPricing.model.js";

/**
 * Get current coin balance
 */
export const getBalance = asyncHandler(async (req, res) => {
  const recruiter = req.recruiter;
  const balance = await getCoinBalance(recruiter._id, "recruiter");

  // Check if balance is low (threshold: 10 coins)
  const lowBalanceThreshold = 10;
  const hasLowBalance = balance < lowBalanceThreshold;

  return res.status(200).json(
    ApiResponse.success(
      {
        coinBalance: balance,
        hasLowBalance,
        lowBalanceThreshold,
        message: hasLowBalance
          ? "Low coin balance. Please purchase more coins to continue."
          : null,
      },
      "Coin balance retrieved successfully"
    )
  );
});

/**
 * Get transaction history
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const recruiter = req.recruiter;
  const { page = 1, limit = 10, transactionType, status } = req.query;

  const result = await getTransactionHistory(recruiter._id, "recruiter", {
    page,
    limit,
    transactionType,
    status,
  });

  return res.status(200).json(
    ApiResponse.success(
      {
        transactions: result.transactions,
        pagination: result.pagination,
      },
      "Transaction history retrieved successfully"
    )
  );
});

/**
 * Get available coin packages for purchase
 */
export const getCoinPackages = asyncHandler(async (req, res) => {
  const packages = await CoinPackage.find({
    category: "recruiter",
    isVisible: true,
  })
    .sort({ coins: 1 })
    .lean();

  const formattedPackages = packages.map((pkg) => ({
    id: pkg._id.toString(),
    name: pkg.name,
    coins: pkg.coins,
    price: {
      amount: pkg.price.amount,
      currency: pkg.price.currency,
    },
  }));

  return res.status(200).json(
    ApiResponse.success(
      {
        packages: formattedPackages,
      },
      "Coin packages retrieved successfully"
    )
  );
});

/**
 * Initiate coin purchase (MOCK - for now)
 * In future, this will create Razorpay order
 */
export const purchaseCoins = asyncHandler(async (req, res) => {
  const recruiter = req.recruiter;
  const { packageId } = req.body;

  if (!packageId) {
    throw new ApiError(400, "Package ID is required");
  }

  // Find the coin package
  const coinPackage = await CoinPackage.findOne({
    _id: packageId,
    category: "recruiter",
    isVisible: true,
  });

  if (!coinPackage) {
    throw new ApiError(404, "Coin package not found or not available");
  }

  // MOCK: For now, directly add coins without payment verification
  // In future, this will create Razorpay order and return order details
  const result = await addCoins(
    recruiter._id,
    "recruiter",
    coinPackage.coins,
    `Coin Purchase: ${coinPackage.name}`,
    coinPackage.price.amount,
    "purchase",
    `MOCK_ORDER_${Date.now()}`, // Mock order ID
    `MOCK_PAYMENT_${Date.now()}`, // Mock payment ID
    null,
    "success"
  );

  return res.status(200).json(
    ApiResponse.success(
      {
        transaction: result.transaction,
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
        coinsAdded: coinPackage.coins,
        package: {
          id: coinPackage._id.toString(),
          name: coinPackage.name,
          coins: coinPackage.coins,
          price: coinPackage.price,
        },
        // MOCK: In future, this will return Razorpay order details
        paymentDetails: {
          orderId: result.transaction.razorpayOrderId,
          status: "success",
          message: "Payment successful (MOCK MODE)",
        },
      },
      "Coins purchased successfully"
    )
  );
});

/**
 * Verify payment and complete purchase (MOCK - for now)
 * In future, this will verify Razorpay payment signature
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const recruiter = req.recruiter;
  const { orderId, paymentId, signature } = req.body;

  // MOCK: For now, just return success
  // In future, this will verify Razorpay payment signature
  // and update transaction status

  return res.status(200).json(
    ApiResponse.success(
      {
        orderId,
        paymentId,
        status: "success",
        message: "Payment verified successfully (MOCK MODE)",
      },
      "Payment verified successfully"
    )
  );
});

