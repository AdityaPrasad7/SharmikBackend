// COMMIT: feat(payment): add recruiter coin payment controller
import crypto from "crypto";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { CoinPackage } from "../../models/admin/coinPricing/coinPricing.model.js";
import { CoinTransaction } from "../../models/coin/coinTransaction.model.js";

export const recruiterPayment = asyncHandler(async (req, res) => {

    /*  get authenticated recruiter from request */
    const recruiter = req.recruiter;

    /* (validation): validate payment request body*/
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
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    //reject payment if Razorpay signature is invalid
    if (expectedSignature !== razorpaySignature) {
        throw new ApiError(400, "Invalid payment signature");
    }

    /* validate coin package existence */
    const coinPackage = await CoinPackage.findById(packageId);
    if (!coinPackage) {
        throw new ApiError(404, "Package not found");
    }

    /* fetch last successful transaction for recruiter*/
    const lastTxn = await CoinTransaction.findOne({
        userId: recruiter._id,
        userType: "recruiter",
        status: "success",
    }).sort({ createdAt: -1 });

    //  feat(wallet): handle first-time recruiter coin purchase
    const prevBalance = lastTxn ? lastTxn.balanceAfter : 0;

    // feat(wallet): calculate updated recruiter wallet balance
    const newBalance = prevBalance + coinPackage.coins;

    /* feat(payment): persist recruiter coin purchase transaction*/
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

    /*
       COMMIT: chore(response): return standardized payment success response
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
