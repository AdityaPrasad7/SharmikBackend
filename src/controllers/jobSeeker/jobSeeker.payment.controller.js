// Node.js crypto module used to verify Razorpay payment signature
import crypto from "crypto";
import mongoose from "mongoose";
// Standard API response formatter
import ApiResponse from "../../utils/ApiResponse.js";
import { JobSeeker } from "../../models/jobSeeker/jobSeeker.model.js";

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
    const { packageId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const jobSeekerId = req.jobSeeker?._id;

    console.log(`[PAYMENT_START] User: ${jobSeekerId} | Order: ${razorpayOrderId} | Package: ${packageId}`);

    // 1. IDEMPOTENCY CHECK
    const existingTxn = await CoinTransaction.findOne({ razorpayPaymentId });
    if (existingTxn) {
        console.log(`[IDEMPOTENCY_HIT] Payment ${razorpayPaymentId} already processed.`);
        return res.status(200).json(
            ApiResponse.success(existingTxn, "Payment already verified. No duplicate coins added.")
        );
    }

    // 2. SIGNATURE VERIFICATION
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (expectedSignature !== razorpaySignature) {
        console.error(`[SIG_VERIFY_FAILED] Expected: ${expectedSignature} | Received: ${razorpaySignature}`);
        throw new ApiError(400, "Invalid payment signature");
    }
    console.log(`[SIG_VERIFY_SUCCESS] Signature valid for Order: ${razorpayOrderId}`);

    // 3. FETCH PACKAGE
    const coinPackage = await CoinPackage.findById(packageId);
    if (!coinPackage) {
        console.error(`[PACKAGE_NOT_FOUND] ID: ${packageId}`);
        throw new ApiError(404, "Package not found");
    }

    // 4. DATABASE SESSION
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log(`[SESSION_STARTED] Transaction session active for user: ${jobSeekerId}`);

    try {
        // 5. UPDATE USER BALANCE
        const updatedUser = await JobSeeker.findByIdAndUpdate(
            jobSeekerId,
            { $inc: { coinBalance: coinPackage.coins } },
            { new: true, session }
        );

        if (!updatedUser) {
            console.error(`[USER_NOT_FOUND] JobSeeker: ${jobSeekerId}`);
            throw new ApiError(404, "Job Seeker not found");
        }

        // 6. CREATE TRANSACTION RECORD
        const txn = await CoinTransaction.create(
            [
                {
                    userId: jobSeekerId,
                    userType: "job-seeker",
                    userTypeModel: "JobSeeker",
                    transactionType: "purchase",
                    amount: coinPackage.coins,
                    price: coinPackage.price?.amount || 0,
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature,
                    status: "success",
                    description: `Purchased ${coinPackage.name} (${coinPackage.coins} coins)`,
                    balanceAfter: updatedUser.coinBalance,
                },
            ],
            { session }
        );

        // 7. COMMIT CHANGES
        await session.commitTransaction();
        session.endSession();

        console.log(`[PAYMENT_SUCCESS] User: ${jobSeekerId} | New Balance: ${updatedUser.coinBalance} | TxnID: ${txn[0]._id}`);

        return res.status(201).json(
            ApiResponse.success(
                {
                    transactionId: txn[0]._id,
                    coinsAdded: coinPackage.coins,
                    currentBalance: updatedUser.coinBalance,
                },
                "Payment verified and coins added."
            )
        );

    } catch (error) {
        // ROLLBACK IF ERROR
        console.error(`[PAYMENT_CRASH] Error occurred: ${error.message}`);
        if (session.inTransaction()) {
            await session.abortTransaction();
            console.warn(`[TRANSACTION_ABORTED] Database changes rolled back.`);
        }
        session.endSession();
        throw error;
    }
});