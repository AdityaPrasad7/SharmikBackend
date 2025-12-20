// // // COMMIT: feat(payment): add recruiter coin payment controller
// import crypto from "crypto";
// import ApiResponse from "../../utils/ApiResponse.js";
// import ApiError from "../../utils/ApiError.js";
// import { asyncHandler } from "../../utils/asyncHandler.js";
// import { CoinPackage } from "../../models/admin/coinPricing/coinPricing.model.js";
// import { CoinTransaction } from "../../models/coin/coinTransaction.model.js";

// export const recruiterPayment = asyncHandler(async (req, res) => {
//     console.log(">>> [Payment Start] Received Body:", req.body);
//     const recruiter = req.recruiter;
//     const { packageId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

//     // 1. Validation
//     if (!packageId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
//         throw new ApiError(400, "Missing payment details");
//     }

//     // 2. Duplicate Check (using OrderId is safer than PaymentId)
//     const existingTransaction = await CoinTransaction.findOne({ razorpayOrderId });
//     if (existingTransaction && existingTransaction.status === "success") {
//         return res.json(ApiResponse.success(
//             { balanceAfter: existingTransaction.balanceAfter },
//             "Payment already processed"
//         ));
//     }

//     // 3. Signature Verification
//     const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(`${razorpayOrderId}|${razorpayPaymentId}`)
//         .digest("hex");

//     if (expectedSignature !== razorpaySignature) {
//         throw new ApiError(400, "Invalid payment signature");
//     }

//     // 4. Get Package & Current Balance
//     const coinPackage = await CoinPackage.findById(packageId);
//     if (!coinPackage) throw new ApiError(404, "Package not found");

//     const lastTxn = await CoinTransaction.findOne({
//         userId: recruiter._id,
//         status: "success",
//     }).sort({ createdAt: -1 });

//     const prevBalance = lastTxn ? lastTxn.balanceAfter : 0;
//     const newBalance = prevBalance + coinPackage.coins;

//     // 5. Atomic Update (The Production Way)
//     try {
//         const txn = await CoinTransaction.create({
//             userId: recruiter._id,
//             userType: "recruiter",
//             userTypeModel: "Recruiter",
//             transactionType: "purchase",
//             amount: coinPackage.coins,
//             price: coinPackage.price, // Changed from .price.amount unless nested
//             razorpayOrderId,
//             razorpayPaymentId,
//             razorpaySignature,
//             status: "success",
//             description: "Recruiter coin purchase",
//             balanceAfter: newBalance,
//         });

//         // CRITICAL: Update the Recruiter's wallet field
//         await Recruiter.findByIdAndUpdate(recruiter._id, {
//             $inc: { totalCoins: coinPackage.coins }
//         });

//         return res.json(ApiResponse.success({
//             transactionId: txn._id,
//             balanceAfter: newBalance,
//         }, "Payment successful"));

//     } catch (error) {
//         if (error.code === 11000) { // MongoDB Duplicate Key Error
//             throw new ApiError(400, "Transaction already processed");
//         }
//         throw error;
//     }
// });

import crypto from "crypto";
import mongoose from "mongoose";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { CoinPackage } from "../../models/admin/coinPricing/coinPricing.model.js";
import { CoinTransaction } from "../../models/coin/coinTransaction.model.js";
import { Recruiter } from "../../models/recruiter/recruiter.model.js";

export const recruiterPayment = asyncHandler(async (req, res) => {
    const recruiterId = req.recruiter._id;
    const { packageId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

<<<<<<< Updated upstream
    /*  get authenticated recruiter from request */
    const recruiter = req.recruiter;

    /* =====================================================
       COMMIT: chore(validation): validate payment request body
    ===================================================== */
    const {
        packageId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = req.body;

    if (
        !packageId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
    ) {
        throw new ApiError(400, "Missing payment details");
    }

    /* verify Razorpay payment signature*/
=======
    console.log(`[PAYMENT_START] Verify Request - Order: ${razorpayOrderId}, Recruiter: ${recruiterId}`);

    // 1. Basic Validation
    if (!packageId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new ApiError(400, "Missing required payment fields");
    }

    // 2. STAGE 1: Check if this order was already processed (Prevention)
    // We check this BEFORE signature verification to save CPU time if it's a duplicate.
    const duplicateCheck = await CoinTransaction.findOne({ razorpayOrderId });
    if (duplicateCheck && duplicateCheck.status === "success") {
        console.warn(`[PAYMENT_ALREADY_DONE] Order ${razorpayOrderId} was already fulfilled. Blocking retry.`);
        return res.status(200).json(ApiResponse.success(
            { balanceAfter: duplicateCheck.balanceAfter },
            "Payment already processed successfully."
        ));
    }

    // 3. Signature Verification
>>>>>>> Stashed changes
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

<<<<<<< Updated upstream
    //reject payment if Razorpay signature is invalid
=======
>>>>>>> Stashed changes
    if (expectedSignature !== razorpaySignature) {
        console.error(`[PAYMENT_INVALID_SIG] Signature mismatch for Order: ${razorpayOrderId}`);
        throw new ApiError(400, "Invalid payment signature. Verification failed.");
    }

<<<<<<< Updated upstream
    /* validate coin package existence */
=======
    // 4. Get Package Data
>>>>>>> Stashed changes
    const coinPackage = await CoinPackage.findById(packageId);
    if (!coinPackage) {
        console.error(`[PAYMENT_PACKAGE_NOT_FOUND] ID: ${packageId}`);
        throw new ApiError(404, "Selected coin package no longer exists.");
    }

<<<<<<< Updated upstream
    /* fetch last successful transaction for recruiter*/
    const lastTxn = await CoinTransaction.findOne({
        userId: recruiter._id,
        userType: "recruiter",
        status: "success",
    }).sort({ createdAt: -1 });

    // COMMIT: feat(wallet): handle first-time recruiter coin purchase
    const prevBalance = lastTxn ? lastTxn.balanceAfter : 0;

    // COMMIT: feat(wallet): calculate updated recruiter wallet balance
    const newBalance = prevBalance + coinPackage.coins;

    /* =====================================================
       COMMIT: feat(payment): persist recruiter coin purchase transaction
    ===================================================== */
    const txn = await CoinTransaction.create({
        userId: recruiter._id,
        userType: "recruiter",
        userTypeModel: "Recruiter",
        transactionType: "purchase",
        amount: coinPackage.coins,
        price: coinPackage.price.amount,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        status: "success",
        description: "Recruiter coin purchase",
        balanceAfter: newBalance,
    });

    /* =====================================================
       COMMIT: chore(response): return standardized payment success response
    ===================================================== */
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
=======
    // 5. STAGE 2: Atomic Update using MongoDB Session
    // This ensures either BOTH the coins are added and receipt is saved, or NOTHING happens.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Double check for duplicate INSIDE the session to prevent "Race Conditions"
        const internalDuplicateCheck = await CoinTransaction.findOne({ razorpayOrderId }).session(session);
        if (internalDuplicateCheck) {
            await session.abortTransaction();
            console.warn(`[PAYMENT_RACE_CONDITION] Prevented double-processing for Order: ${razorpayOrderId}`);
            return res.json(ApiResponse.success({ balanceAfter: internalDuplicateCheck.balanceAfter }, "Already processed."));
        }

        // A. Increment coins in Recruiter model
        const updatedRecruiter = await Recruiter.findByIdAndUpdate(
            recruiterId,
            { $inc: { coinBalance: coinPackage.coins } },
            { new: true, session }
        );

        if (!updatedRecruiter) {
            throw new Error("Recruiter account not found during coin update.");
        }

        // B. Save the Transaction Receipt
        const txn = await CoinTransaction.create([{
            userId: recruiterId,
            userType: "recruiter",
            userTypeModel: "Recruiter",
            transactionType: "purchase",
            amount: coinPackage.coins,
            price: coinPackage.price.amount,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            status: "success",
            description: `Purchased ${coinPackage.name} (${coinPackage.coins} coins)`,
            balanceAfter: updatedRecruiter.coinBalance,
        }], { session });

        // Commit all changes to the database
        await session.commitTransaction();
        console.log(`[PAYMENT_FINALIZED] Order: ${razorpayOrderId} | Coins Added: ${coinPackage.coins} | New Balance: ${updatedRecruiter.coinBalance}`);

        return res.json(ApiResponse.success({
            transactionId: txn[0]._id,
            balanceAfter: updatedRecruiter.coinBalance,
        }, "Coins added successfully to your account."));

    } catch (error) {
        // If anything fails, undo all database changes in this session
        await session.abortTransaction();
        console.error(`[PAYMENT_DB_FAILURE] Order: ${razorpayOrderId} | Error: ${error.message}`);

        if (error.code === 11000) {
            throw new ApiError(400, "Transaction already recorded in database.");
        }
        throw new ApiError(500, "Internal server error during payment fulfillment.");
    } finally {
        session.endSession();
    }
});
>>>>>>> Stashed changes
