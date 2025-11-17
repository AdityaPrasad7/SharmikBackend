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

const booleanField = Joi.boolean().default(false);

const benefitsSchema = Joi.object({
  foodProvided: booleanField,
  accommodationProvided: booleanField,
  travelFacility: booleanField,
}).default({});

const aboutCompanySchema = Joi.object({
  name: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().allow("").optional(),
  industry: Joi.string().trim().allow("").optional(),
  employeesCount: Joi.string().trim().allow("").optional(),
  employeeCount: Joi.string().trim().allow("").optional(),
  location: Joi.string().trim().allow("").optional(),
}).default({});

const stringArray = Joi.array().items(Joi.string().trim().min(1)).default([]);

export const createRecruiterJobSchema = Joi.object({
  jobTitle: Joi.string().trim().min(3).required(),
  jobDescription: Joi.string().trim().min(20).required(),
  city: Joi.string().trim().min(2).required(),
  expectedSalaryMin: Joi.number().positive().required(),
  expectedSalaryMax: Joi.number()
    .positive()
    .min(Joi.ref("expectedSalaryMin"))
    .required()
    .messages({
      "number.min": "Maximum salary must be greater than or equal to minimum salary",
    }),
  salaryCurrency: Joi.string().trim().default("INR"),
  salaryPayPeriod: Joi.string().valid("monthly", "annual").default("monthly"),
  employeeCount: Joi.number().integer().min(1).optional(),
  jobType: Joi.string().valid("Full Time", "Part Time", "Contract").required(),
  employmentMode: Joi.string().valid("Onsite", "Remote", "Hybrid").default("Onsite"),
  categories: Joi.alternatives()
    .try(stringArray.min(1), Joi.string().trim().min(1))
    .required()
    .messages({
      "any.required": "At least one job category is required",
    }),
  tags: Joi.alternatives().try(stringArray, Joi.string().trim()),
  benefits: benefitsSchema,
  experienceMinYears: Joi.number().min(0).default(0),
  experienceMaxYears: Joi.number()
    .min(Joi.ref("experienceMinYears"))
    .optional()
    .messages({
      "number.min": "Experience max must be greater than or equal to experience min",
    }),
  qualifications: Joi.alternatives().try(stringArray.min(1), Joi.string().trim()),
  responsibilities: Joi.alternatives().try(stringArray, Joi.string().trim()),
  aboutCompany: aboutCompanySchema,
}).custom((value, helpers) => {
  const cloned = { ...value };

  const normalizeField = (field) => {
    if (!cloned[field]) return;
    if (!Array.isArray(cloned[field])) {
      cloned[field] = [cloned[field]];
    }
  };

  ["categories", "tags", "qualifications", "responsibilities"].forEach(normalizeField);

  return cloned;
});

