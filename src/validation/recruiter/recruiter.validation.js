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

// Recruiter Registration Schema (basic for now)
export const recruiterRegistrationSchema = Joi.object({
  phone: phoneSchema,
  companyName: Joi.string().trim().min(1).optional(),
  email: Joi.string().email().trim().lowercase().optional(),
  state: Joi.string().trim().min(1).optional(),
  city: Joi.string().trim().min(1).optional(),
});

