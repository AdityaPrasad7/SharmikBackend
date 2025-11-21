import Joi from "joi";

// Common schemas
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

const categorySchema = Joi.string()
  .valid("Non-Degree Holder", "Diploma Holder", "ITI Holder")
  .optional()
  .messages({
    "any.only": "Category must be one of: Non-Degree Holder, Diploma Holder, ITI Holder",
  });

// Unified Send OTP Schema
// category is optional - only needed for new job seeker registration
export const sendOTPSchema = Joi.object({
  phone: phoneSchema,
  category: categorySchema, // Optional - helps determine user type for new users
}); 

// Unified Verify OTP Schema
// category is required only for new job seeker registration
export const verifyOTPSchema = Joi.object({
  phone: phoneSchema,
  otp: otpSchema,
  category: categorySchema, // Optional - required only for new job seeker registration
});

