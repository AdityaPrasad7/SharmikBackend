// Node.js crypto module used to verify Razorpay payment signature
import crypto from "crypto";

// Standard API response formatter
import ApiResponse from "../../utils/ApiResponse.js";

// Custom error handler
import ApiError from "../../utils/ApiError.js";

// Wrapper to handle async errors without try/catch everywhere
import { asyncHandler } from "../../utils/asyncHandler.js";

// Coin packages defined by admin (price + coins)
import { CoinPackage } from "../../models/admin/coinPricing/coinPricing.model.js";

// Coin transaction history model
import { CoinTransaction } from "../../models/coin/coinTransaction.model.js";

/**
 * Job Seeker Payment Controller
 * ------------------------------------
 * - Verifies Razorpay payment
 * - Validates purchased coin package
 * - Calculates new coin balance
 * - Stores successful transaction
 */
export const jobSeekerPayment = asyncHandler(async (req, res) => {

    // Auth middleware attaches logged-in job seeker to req
    const jobSeeker = req.jobSeeker;

    // Extract payment details from request body
    const {
        packageId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = req.body;

    // Validate required payment fields
    if (!packageId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new ApiError(400, "Missing payment details");
    }

    /**
     * Razorpay Signature Verification
     * --------------------------------
     * Razorpay sends a signature that must be validated
     * to ensure the payment is genuine and not tampered
     */
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    // If signature does not match, payment is invalid
    if (expectedSignature !== razorpaySignature) {
        throw new ApiError(400, "Invalid payment signature");
    }

    /**
     * Fetch Coin Package
     * ------------------
     * Validate the package selected by the job seeker
     */
    const coinPackage = await CoinPackage.findById(packageId);
    if (!coinPackage) {
        throw new ApiError(404, "Package not found");
    }

    /**
     * Get Last Successful Transaction
     * --------------------------------
     * Used to calculate previous balance
     */
    const lastTxn = await CoinTransaction.findOne({
        userId: jobSeeker._id,
        userType: "job-seeker",
        status: "success",
    }).sort({ createdAt: -1 });

    // If no previous transaction exists, balance starts from 0
    const prevBalance = lastTxn ? lastTxn.balanceAfter : 0;

    // Add purchased coins to previous balance
    const newBalance = prevBalance + coinPackage.coins;

    /**
     * Create Transaction Record
     * -------------------------
     * Stores payment + coin credit details
     */
    const txn = await CoinTransaction.create({
        userId: jobSeeker._id,
        userType: "job-seeker",
        userTypeModel: "JobSeeker",
        transactionType: "purchase",
        amount: coinPackage.coins,             // Coins added
        price: coinPackage.price.amount,       // INR price
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        status: "success",
        description: "JobSeeker coin purchase",
        balanceAfter: newBalance,
    });

    /**
     * Send Success Response
     * ---------------------
     * Returns transaction info and updated balance
     */
    return res.json(
        ApiResponse.success(
            {
                transactionId: txn._id,
                coinsAdded: coinPackage.coins,
                balanceAfter: newBalance,
            },
            "Payment successful"
        )
    );
});
