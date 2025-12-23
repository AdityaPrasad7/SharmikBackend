import crypto from "crypto";
import { JobSeeker } from "../models/jobSeeker/jobSeeker.model.js";
import { Recruiter } from "../models/recruiter/recruiter.model.js";

/**
 * Generate a unique referral code
 * Format: 6-8 uppercase alphanumeric characters
 * @returns {string} Unique referral code
 */
export const generateReferralCode = () => {
    // Generate 6 random bytes and convert to uppercase alphanumeric
    const code = crypto
        .randomBytes(4)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
        .substring(0, 8)
        .toUpperCase();

    return code;
};

/**
 * Generate a unique referral code that doesn't exist in the database
 * @param {string} userType - "JobSeeker" or "Recruiter"
 * @returns {Promise<string>} Unique referral code
 */
export const generateUniqueReferralCode = async (userType = "JobSeeker") => {
    const Model = userType === "Recruiter" ? Recruiter : JobSeeker;
    const otherModel = userType === "Recruiter" ? JobSeeker : Recruiter;

    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        code = generateReferralCode();

        // Check uniqueness in both models (referral codes should be globally unique)
        const existsInPrimary = await Model.findOne({ referralCode: code }).lean();
        const existsInOther = await otherModel.findOne({ referralCode: code }).lean();

        if (!existsInPrimary && !existsInOther) {
            isUnique = true;
        }

        attempts++;
    }

    if (!isUnique) {
        // Fallback: Add timestamp to ensure uniqueness
        code = `${generateReferralCode()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
    }

    return code;
};

/**
 * Validate a referral code and find the referrer
 * @param {string} referralCode - The referral code to validate
 * @returns {Promise<{isValid: boolean, referrer: object|null, referrerType: string|null}>}
 */
export const validateReferralCode = async (referralCode) => {
    if (!referralCode || typeof referralCode !== "string") {
        return { isValid: false, referrer: null, referrerType: null };
    }

    const normalizedCode = referralCode.trim().toUpperCase();

    // Check in JobSeeker collection
    const jobSeekerReferrer = await JobSeeker.findOne({
        referralCode: normalizedCode,
    }).lean();

    if (jobSeekerReferrer) {
        return {
            isValid: true,
            referrer: jobSeekerReferrer,
            referrerType: "JobSeeker",
        };
    }

    // Check in Recruiter collection
    const recruiterReferrer = await Recruiter.findOne({
        referralCode: normalizedCode,
    }).lean();

    if (recruiterReferrer) {
        return {
            isValid: true,
            referrer: recruiterReferrer,
            referrerType: "Recruiter",
        };
    }

    return { isValid: false, referrer: null, referrerType: null };
};

/**
 * Assign referral code to a user if they don't have one
 * @param {object} user - User document
 * @param {string} userType - "JobSeeker" or "Recruiter"
 * @returns {Promise<string>} The referral code (existing or newly generated)
 */
export const ensureReferralCode = async (user, userType) => {
    if (user.referralCode) {
        return user.referralCode;
    }

    const referralCode = await generateUniqueReferralCode(userType);
    user.referralCode = referralCode;
    await user.save();

    return referralCode;
};
