import Joi from "joi";

const phoneSchema = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .required()
  .messages({
    "string.pattern.base": "Phone number must be a valid 10-digit Indian mobile number",
    "any.required": "Phone number is required",
  });

const otpSchema = Joi.string()
  .length(4)
  .pattern(/^\d{4}$/)
  .required()
  .messages({
    "string.length": "OTP must be exactly 4 digits",
    "string.pattern.base": "OTP must contain only digits",
    "any.required": "OTP is required",
  });

// Send OTP Schema for Recruiter
export const sendOTPSchema = Joi.object({
  phone: phoneSchema,
});

// Verify OTP Schema for Recruiter
export const verifyOTPSchema = Joi.object({
  phone: phoneSchema,
  otp: otpSchema,
});

const objectIdSchema = Joi.string()
  .hex()
  .length(24)
  .messages({
    "string.hex": "recruiterId must be a valid ObjectId",
    "string.length": "recruiterId must be exactly 24 characters",
  });

// Recruiter Registration Schema (basic for now)
export const recruiterRegistrationSchema = Joi.object({
  phone: phoneSchema.optional(),
  recruiterId: objectIdSchema.optional(),
  companyName: Joi.string().trim().allow("").optional(),
  email: Joi.string().email().trim().lowercase().optional(),
  state: Joi.string().trim().min(1).optional(),
  city: Joi.string().trim().min(1).optional(),
}).or("phone", "recruiterId");


