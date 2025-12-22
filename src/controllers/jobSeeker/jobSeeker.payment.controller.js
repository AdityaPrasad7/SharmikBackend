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

// Coin packages and rules defined by admin
import { CoinPackage, CoinRule } from "../../models/admin/coinPricing/coinPricing.model.js";

// Coin transaction history model
import { CoinTransaction } from "../../models/coin/coinTransaction.model.js";

/**
 * Job Seeker Payment Controller
 * ------------------------------------
 * Supports TWO types of purchases:
 * 1. Package Purchase: Provide packageId
 * 2. Custom Amount: Provide amount (in INR) - coins calculated using rate
 */

export const jobSeekerPayment = asyncHandler(async (req, res) => {
    const { packageId, amount, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const jobSeekerId = req.jobSeeker?._id;

    console.log('\n========== JOB SEEKER PAYMENT API CALLED ==========');
    console.log('[PAYMENT] Request Body:', JSON.stringify(req.body, null, 2));
    console.log('[PAYMENT] User ID:', jobSeekerId);
    console.log('[PAYMENT] Package ID:', packageId || 'Not provided (Custom Amount)');
    console.log('[PAYMENT] Amount:', amount || 'Not provided (Package Purchase)');
    console.log('[PAYMENT] Razorpay Order ID:', razorpayOrderId);
    console.log('[PAYMENT] Razorpay Payment ID:', razorpayPaymentId);
    console.log('====================================================\n');

    // Validate: Either packageId OR amount must be provided
    if (!packageId && !amount) {
        console.log('[PAYMENT_ERROR] Neither packageId nor amount provided!');
        throw new ApiError(400, "Either packageId or amount is required");
    }

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

    // 3. DETERMINE COINS TO ADD
    let coinsToAdd = 0;
    let priceAmount = 0;
    let description = "";

    if (packageId) {
        // PACKAGE PURCHASE
        const coinPackage = await CoinPackage.findById(packageId);
        if (!coinPackage) {
            console.error(`[PACKAGE_NOT_FOUND] ID: ${packageId}`);
            throw new ApiError(404, "Package not found");
        }
        coinsToAdd = coinPackage.coins;
        priceAmount = coinPackage.price?.amount || 0;
        description = `Purchased ${coinPackage.name} (${coinPackage.coins} coins)`;
    } else {
        // CUSTOM AMOUNT PURCHASE
        console.log('[PAYMENT] Custom Amount Mode - Fetching CoinRule...');
        const rule = await CoinRule.findOne({ category: "jobSeeker" });
        const baseAmount = rule?.baseAmount ?? 100;
        const baseCoins = rule?.baseCoins ?? 100;

        console.log('[PAYMENT] CoinRule Found:', { baseAmount, baseCoins });

        // Calculate coins: (amount / baseAmount) * baseCoins
        coinsToAdd = Math.floor((amount / baseAmount) * baseCoins);
        priceAmount = amount;
        description = `Custom purchase: ₹${amount} = ${coinsToAdd} coins`;

        console.log('[PAYMENT] Calculated:', { amount, coinsToAdd, formula: `(${amount} / ${baseAmount}) * ${baseCoins}` });

        if (coinsToAdd <= 0) {
            console.log('[PAYMENT_ERROR] Coins to add is 0 or negative!');
            throw new ApiError(400, "Invalid amount. Coins must be greater than 0.");
        }
    }

    // 4. DATABASE SESSION
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log(`[SESSION_STARTED] Transaction session active for user: ${jobSeekerId}`);

    try {
        // 5. UPDATE USER BALANCE
        const updatedUser = await JobSeeker.findByIdAndUpdate(
            jobSeekerId,
            { $inc: { coinBalance: coinsToAdd } },
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
                    amount: coinsToAdd,
                    price: priceAmount,
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature,
                    status: "success",
                    description,
                    balanceAfter: updatedUser.coinBalance,
                },
            ],
            { session }
        );

        // 7. COMMIT CHANGES
        await session.commitTransaction();
        session.endSession();

        console.log('\n========== PAYMENT SUCCESS ==========');
        console.log('[SUCCESS] User ID:', jobSeekerId);
        console.log('[SUCCESS] Coins Added:', coinsToAdd);
        console.log('[SUCCESS] Previous Balance:', updatedUser.coinBalance - coinsToAdd);
        console.log('[SUCCESS] New Balance:', updatedUser.coinBalance);
        console.log('[SUCCESS] Transaction ID:', txn[0]._id);
        console.log('[SUCCESS] Description:', description);
        console.log('======================================\n');

        return res.status(201).json(
            ApiResponse.success(
                {
                    transactionId: txn[0]._id,
                    coinsAdded: coinsToAdd,
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