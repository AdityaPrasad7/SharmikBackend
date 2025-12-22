
import crypto from "crypto";
import mongoose from "mongoose";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { CoinPackage, CoinRule } from "../../models/admin/coinPricing/coinPricing.model.js";
import { CoinTransaction } from "../../models/coin/coinTransaction.model.js";
import { Recruiter } from "../../models/recruiter/recruiter.model.js";

/**
 * Recruiter Payment Controller
 * ------------------------------------
 * Supports TWO types of purchases:
 * 1. Package Purchase: Provide packageId
 * 2. Custom Amount: Provide amount (in INR) - coins calculated using rate
 */

export const recruiterPayment = asyncHandler(async (req, res) => {
    const recruiterId = req.recruiter._id;
    const { packageId, amount, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    console.log('\n========== RECRUITER PAYMENT API CALLED ==========');
    console.log('[PAYMENT] Request Body:', JSON.stringify(req.body, null, 2));
    console.log('[PAYMENT] Recruiter ID:', recruiterId);
    console.log('[PAYMENT] Package ID:', packageId || 'Not provided (Custom Amount)');
    console.log('[PAYMENT] Amount:', amount || 'Not provided (Package Purchase)');
    console.log('[PAYMENT] Razorpay Order ID:', razorpayOrderId);
    console.log('[PAYMENT] Razorpay Payment ID:', razorpayPaymentId);
    console.log('===================================================\n');

    // 1. Basic Validation - Either packageId OR amount required
    if (!packageId && !amount) {
        console.log('[PAYMENT_ERROR] Neither packageId nor amount provided!');
        throw new ApiError(400, "Either packageId or amount is required");
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        console.log('[PAYMENT_ERROR] Missing Razorpay fields!');
        throw new ApiError(400, "Missing required payment fields");
    }

    // 2. STAGE 1: Check if this order was already processed (Prevention)
    const duplicateCheck = await CoinTransaction.findOne({ razorpayOrderId });
    if (duplicateCheck && duplicateCheck.status === "success") {
        console.warn(`[PAYMENT_ALREADY_DONE] Order ${razorpayOrderId} was already fulfilled.`);
        return res.status(200).json(ApiResponse.success(
            { balanceAfter: duplicateCheck.balanceAfter },
            "Payment already processed successfully."
        ));
    }

    // 3. Signature Verification
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (expectedSignature !== razorpaySignature) {
        console.error(`[PAYMENT_INVALID_SIG] Signature mismatch for Order: ${razorpayOrderId}`);
        throw new ApiError(400, "Invalid payment signature. Verification failed.");
    }

    // 4. DETERMINE COINS TO ADD
    let coinsToAdd = 0;
    let priceAmount = 0;
    let description = "";

    if (packageId) {
        // PACKAGE PURCHASE
        const coinPackage = await CoinPackage.findById(packageId);
        if (!coinPackage) {
            console.error(`[PAYMENT_PACKAGE_NOT_FOUND] ID: ${packageId}`);
            throw new ApiError(404, "Selected coin package no longer exists.");
        }
        coinsToAdd = coinPackage.coins;
        priceAmount = coinPackage.price?.amount || 0;
        description = `Purchased ${coinPackage.name} (${coinPackage.coins} coins)`;
    } else {
        // CUSTOM AMOUNT PURCHASE
        console.log('[PAYMENT] Custom Amount Mode - Fetching CoinRule...');
        const rule = await CoinRule.findOne({ category: "recruiter" });
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

    // 5. STAGE 2: Atomic Update using MongoDB Session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Double check for duplicate INSIDE the session to prevent Race Conditions
        const internalDuplicateCheck = await CoinTransaction.findOne({ razorpayOrderId }).session(session);
        if (internalDuplicateCheck) {
            await session.abortTransaction();
            console.warn(`[PAYMENT_RACE_CONDITION] Prevented double-processing for Order: ${razorpayOrderId}`);
            return res.json(ApiResponse.success({ balanceAfter: internalDuplicateCheck.balanceAfter }, "Already processed."));
        }

        // A. Increment coins in Recruiter model
        const updatedRecruiter = await Recruiter.findByIdAndUpdate(
            recruiterId,
            { $inc: { coinBalance: coinsToAdd } },
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
            amount: coinsToAdd,
            price: priceAmount,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            status: "success",
            description,
            balanceAfter: updatedRecruiter.coinBalance,
        }], { session });

        // Commit all changes to the database
        await session.commitTransaction();

        console.log('\n========== PAYMENT SUCCESS ==========');
        console.log('[SUCCESS] Recruiter ID:', recruiterId);
        console.log('[SUCCESS] Coins Added:', coinsToAdd);
        console.log('[SUCCESS] Previous Balance:', updatedRecruiter.coinBalance - coinsToAdd);
        console.log('[SUCCESS] New Balance:', updatedRecruiter.coinBalance);
        console.log('[SUCCESS] Transaction ID:', txn[0]._id);
        console.log('[SUCCESS] Description:', description);
        console.log('======================================\n');

        return res.json(ApiResponse.success({
            transactionId: txn[0]._id,
            coinsAdded: coinsToAdd,
            currentBalance: updatedRecruiter.coinBalance,
        }, "Coins added successfully to your account."));

    } catch (error) {
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
