import { Recruiter } from "../../models/recruiter/recruiter.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { storeOTP, verifyOTP as verifyOTPFromService } from "../../utils/otpService.js";
import { getFileUrl } from "../../middlewares/fileUpload.js";

/**
 * Send OTP for mobile verification (Recruiter)
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  // Check if recruiter already exists
  const existingRecruiter = await Recruiter.findOne({ phone });
  if (existingRecruiter && existingRecruiter.phoneVerified) {
    throw new ApiError(409, "Phone number already registered");
  }

  // Generate and store OTP
  const otp = await storeOTP(phone, "registration");

  // In production, send OTP via SMS service here
  console.log(`OTP for ${phone}: ${otp}`);

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { otp: process.env.NODE_ENV === "development" ? otp : undefined },
        "OTP sent successfully"
      )
    );
});

/**
 * Verify OTP (Recruiter)
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  // Verify OTP
  const isValid = await verifyOTPFromService(phone, otp, "registration");
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Create or update recruiter
  let recruiter = await Recruiter.findOne({ phone });

  if (!recruiter) {
    recruiter = await Recruiter.create({
      phone,
      phoneVerified: true,
      registrationStep: 1,
    });
  } else {
    recruiter.phoneVerified = true;
    recruiter.registrationStep = 1;
    await recruiter.save();
  }

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { recruiter },
        "OTP verified successfully"
      )
    );
});

/**
 * Register Recruiter (Basic registration)
 */
export const registerRecruiter = asyncHandler(async (req, res) => {
  const { phone, companyName, email, state, city } = req.body;

  // Find recruiter
  const recruiter = await Recruiter.findOne({ phone });
  if (!recruiter || !recruiter.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number first");
  }

  // Handle file uploads
  const profilePhoto = req.files?.profilePhoto?.[0]
    ? getFileUrl(req.files.profilePhoto[0].path)
    : null;
  const documents = req.files?.documents
    ? req.files.documents.map((file) => getFileUrl(file.path))
    : [];

  // Update recruiter
  recruiter.companyName = companyName;
  recruiter.email = email;
  recruiter.state = state;
  recruiter.city = city;
  if (profilePhoto) {
    recruiter.profilePhoto = profilePhoto;
  }
  if (documents.length > 0) {
    recruiter.documents = documents;
  }
  recruiter.registrationStep = 2;
  recruiter.isRegistrationComplete = true;
  recruiter.status = "Pending";

  await recruiter.save();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { recruiter },
        "Registration completed successfully"
      )
    );
});

/**
 * Get Recruiter by Phone
 */
export const getRecruiterByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  const recruiter = await Recruiter.findOne({ phone }).lean();

  if (!recruiter) {
    throw new ApiError(404, "Recruiter not found");
  }

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { recruiter },
        "Recruiter fetched successfully"
      )
    );
});

