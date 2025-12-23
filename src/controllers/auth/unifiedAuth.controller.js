import { JobSeeker } from "../../models/jobSeeker/jobSeeker.model.js";
import { Recruiter } from "../../models/recruiter/recruiter.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { storeOTP, verifyOTP as verifyOTPFromService } from "../../utils/otpService.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwtToken.js";
import { generateUniqueReferralCode } from "../../utils/referralCode.js";

/**
 * Unified Send OTP - Automatically detects user type (job-seeker or recruiter)
 * Based on phone number presence in JobSeeker or Recruiter tables
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { phone, category } = req.body;

  // Check both tables to determine user type
  const existingJobSeeker = await JobSeeker.findOne({ phone });
  const existingRecruiter = await Recruiter.findOne({ phone });

  // If phone exists in both tables (shouldn't happen with cross-table validation, but check anyway)
  if (existingJobSeeker && existingRecruiter) {
    throw new ApiError(400, "Invalid number");
  }

  // Determine user type and existing user status
  let userType = null;
  let isExistingUser = false;
  let purpose = "registration";

  if (existingJobSeeker) {
    userType = "job-seeker";
    isExistingUser = true;
    purpose = "login";
  } else if (existingRecruiter) {
    userType = "recruiter";
    isExistingUser = true;
    purpose = "login";
  } else {
    // New user - userType will be determined after registration
    // For now, if category is provided, assume it's a job seeker
    if (category) {
      userType = "job-seeker";
    }
    purpose = "registration";
  }

  // Generate and store OTP
  const otp = await storeOTP(phone, purpose);

  // In production, send OTP via SMS service here
  console.log(`OTP for ${phone} (${purpose}, userType: ${userType || 'unknown'}): ${otp}`);

  const shouldReturnOTP =
    process.env.NODE_ENV === "development" ||
    process.env.RETURN_OTP_IN_RESPONSE === "true" ||
    otp === "1234";

  return res.status(200).json(
    ApiResponse.success(
      {
        otp: shouldReturnOTP ? otp : undefined,
        isExistingUser,
        userType, // Return userType so frontend knows what to expect
      },
      "OTP sent successfully"
    )
  );
});

/**
 * Unified Verify OTP - Automatically detects user type and handles verification
 * Returns appropriate tokens and user data based on user type
 * Optionally registers FCM token if provided
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, category, fcmToken } = req.body;
  console.log("phone", phone);
  console.log("otp", otp);
  console.log("category", category);
  console.log("fcmToken", fcmToken);
  // Check both tables to determine user type
  let existingJobSeeker = await JobSeeker.findOne({ phone });
  let existingRecruiter = await Recruiter.findOne({ phone });

  // If phone exists in both tables (shouldn't happen, but check anyway)
  if (existingJobSeeker && existingRecruiter) {
    throw new ApiError(400, "Invalid number");
  }

  // Determine user type and purpose
  let userType = null;
  let purpose = "registration";

  if (existingJobSeeker) {
    userType = "job-seeker";
    purpose = "login";
  } else if (existingRecruiter) {
    userType = "recruiter";
    purpose = "login";
  } else {
    // New user - determine user type from category
    // If category is provided, it's a job seeker
    // Otherwise, it's a recruiter (recruiters don't need category)
    if (category) {
      userType = "job-seeker";
      purpose = "registration";
    } else {
      // For new users without category, default to recruiter
      // Frontend should provide category for job seekers
      userType = "recruiter";
      purpose = "registration";
    }
  }

  // Check if existing user is blocked
  if (existingJobSeeker && existingJobSeeker.isBlocked) {
    throw new ApiError(403, "Your account has been blocked. Please contact support.");
  }
  if (existingRecruiter && existingRecruiter.isBlocked) {
    throw new ApiError(403, "Your account has been blocked. Please contact support.");
  }

  // Verify OTP with correct purpose
  const isValid = await verifyOTPFromService(phone, otp, purpose);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Handle verification based on user type (pass fcmToken)
  if (userType === "job-seeker") {
    return handleJobSeekerVerification(req, res, existingJobSeeker, phone, category, purpose, fcmToken);
  } else if (userType === "recruiter") {
    return handleRecruiterVerification(req, res, existingRecruiter, phone, purpose, fcmToken);
  } else {
    throw new ApiError(400, "Unable to determine user type. Please provide category for job seeker registration.");
  }
});

/**
 * Handle Job Seeker OTP Verification
 */
const handleJobSeekerVerification = async (req, res, jobSeeker, phone, category, purpose, fcmToken) => {
  if (!jobSeeker) {
    // New job seeker - Registration flow: category is REQUIRED
    if (!category) {
      throw new ApiError(400, "Category is required for job seeker registration");
    }

    // Create job seeker with only the required fields for OTP verification
    // Explicitly set fields to avoid any issues with extra fields from req.body
    // Generate unique referral code for new user
    const newUserReferralCode = await generateUniqueReferralCode("JobSeeker");

    const jobSeekerData = {
      phone: phone?.toString().trim(),
      phoneVerified: true,
      category: category?.toString().trim(),
      registrationStep: 1,
      referralCode: newUserReferralCode,
    };

    jobSeeker = await JobSeeker.create(jobSeekerData);
  } else {
    // Existing job seeker - Login flow: category is optional
    jobSeeker.phoneVerified = true;

    if (category) {
      jobSeeker.category = category;
      // Reset registration step if category changed
      if (jobSeeker.registrationStep > 1) {
        jobSeeker.registrationStep = 1;
      }
    }

    await jobSeeker.save();
  }

  // Ensure user has a referral code
  if (!jobSeeker.referralCode) {
    jobSeeker.referralCode = await generateUniqueReferralCode("JobSeeker");
    await jobSeeker.save();
  }

  // Generate JWT tokens
  const accessToken = generateAccessToken({
    id: jobSeeker._id.toString(),
    phone: jobSeeker.phone,
    role: jobSeeker.role || "job-seeker",
  });

  const refreshToken = generateRefreshToken({
    id: jobSeeker._id.toString(),
    phone: jobSeeker.phone,
  });

  // Save refresh token to database
  jobSeeker.refreshToken = refreshToken;
  await jobSeeker.save({ select: "+refreshToken" });

  // Register FCM token if provided - add to user's fcmTokens array
  let updatedFcmTokens = jobSeeker.fcmTokens || [];
  if (fcmToken) {
    console.log("📱 Adding FCM token to user:", fcmToken);
    const updatedUser = await JobSeeker.findByIdAndUpdate(
      jobSeeker._id,
      { $addToSet: { fcmTokens: fcmToken } },
      { new: true }
    );
    updatedFcmTokens = updatedUser.fcmTokens;
    console.log("📱 FCM token added to user's fcmTokens array");
  }

  // Prepare safe job seeker data
  const safeJobSeeker = {
    _id: jobSeeker._id,
    phone: jobSeeker.phone,
    phoneVerified: jobSeeker.phoneVerified,
    category: jobSeeker.category,
    role: jobSeeker.role,
    registrationStep: jobSeeker.registrationStep,
    isRegistrationComplete: jobSeeker.isRegistrationComplete,
    status: jobSeeker.status,
    fcmTokens: updatedFcmTokens,
    referralCode: jobSeeker.referralCode,
    coinBalance: jobSeeker.coinBalance || 0,
  };

  // Set refresh token as HTTP-only cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);

  return res.status(200).json(
    ApiResponse.success(
      {
        accessToken,
        refreshToken,
        user: safeJobSeeker,
        userType: "job-seeker",
        isExistingUser: purpose === "login",
      },
      purpose === "login" ? "Login successful" : "OTP verified successfully"
    )
  );
};

/**
 * Handle Recruiter OTP Verification
 */
const handleRecruiterVerification = async (req, res, recruiter, phone, purpose, fcmToken) => {
  if (!recruiter) {
    // New recruiter - Registration flow
    // Generate unique referral code for new user
    const newUserReferralCode = await generateUniqueReferralCode("Recruiter");

    recruiter = await Recruiter.create({
      phone,
      phoneVerified: true,
      registrationStep: 1,
      role: "recruiter",
      referralCode: newUserReferralCode,
    });
  } else {
    // Existing recruiter - Login flow
    recruiter.phoneVerified = true;
    if (recruiter.registrationStep < 1) {
      recruiter.registrationStep = 1;
    }
    await recruiter.save();
  }

  // Ensure user has a referral code
  if (!recruiter.referralCode) {
    recruiter.referralCode = await generateUniqueReferralCode("Recruiter");
    await recruiter.save();
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    id: recruiter._id.toString(),
    phone: recruiter.phone,
    role: recruiter.role || "recruiter",
  });

  const refreshToken = generateRefreshToken({
    id: recruiter._id.toString(),
    phone: recruiter.phone,
  });

  recruiter.refreshToken = refreshToken;
  await recruiter.save();

  // Register FCM token if provided - add to user's fcmTokens array
  let updatedFcmTokens = recruiter.fcmTokens || [];
  if (fcmToken) {
    const updatedUser = await Recruiter.findByIdAndUpdate(
      recruiter._id,
      { $addToSet: { fcmTokens: fcmToken } },
      { new: true }
    );
    updatedFcmTokens = updatedUser.fcmTokens;
  }

  const safeRecruiter = {
    _id: recruiter._id,
    phone: recruiter.phone,
    phoneVerified: recruiter.phoneVerified,
    registrationStep: recruiter.registrationStep,
    isRegistrationComplete: recruiter.isRegistrationComplete,
    status: recruiter.status,
    companyName: recruiter.companyName,
    role: recruiter.role,
    fcmTokens: updatedFcmTokens,
    referralCode: recruiter.referralCode,
    coinBalance: recruiter.coinBalance || 0,
  };

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie("recruiterRefreshToken", refreshToken, cookieOptions);

  return res.status(200).json(
    ApiResponse.success(
      {
        accessToken,
        refreshToken,
        user: safeRecruiter,
        userType: "recruiter",
        isExistingUser: purpose === "login",
      },
      purpose === "login" ? "Login successful" : "OTP verified successfully"
    )
  );
};

// Unified Logout for BOTH Recruiter and JobSeeker

export const unifiedLogout = asyncHandler(async (req, res) => {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  const { fcmToken } = req.body;

  if (!accessToken) {
    return res.status(200).json(
      ApiResponse.success(null, "Logged out successfully")
    );
  }

  let decoded;
  try {
    const jwt = await import("jsonwebtoken");
    decoded = jwt.default.decode(accessToken); // decode only (works even if expired)
  } catch {
    return res.status(200).json(
      ApiResponse.success(null, "Logged out successfully")
    );
  }

  const userId = decoded?.id || decoded?._id;
  if (!userId) {
    return res.status(200).json(
      ApiResponse.success(null, "Logged out successfully")
    );
  }

  // Clear refreshToken and ALL fcmTokens
  const updateQuery = {
    $set: {
      refreshToken: null,
      fcmTokens: []  // Clear all FCM tokens on logout
    }
  };

  let user =
    (await JobSeeker.findByIdAndUpdate(userId, updateQuery)) ||
    (await Recruiter.findByIdAndUpdate(userId, updateQuery));

  // Clear cookie (web support)
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json(
    ApiResponse.success(null, "Logged out successfully")
  );
});
