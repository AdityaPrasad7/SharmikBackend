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
  .required();

const stateSchema = Joi.string().trim().min(1).required();
const citySchema = Joi.string().trim().min(1).required();

// State ID Schema (MongoDB ObjectId)
const stateIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .optional()
  .messages({
    "string.pattern.base": "Invalid state ID",
  });

// City ID Schema (MongoDB ObjectId)
const cityIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .optional()
  .messages({
    "string.pattern.base": "Invalid city ID",
  });

// Send OTP Schema (category is optional here, will be sent in verify-otp)
export const sendOTPSchema = Joi.object({
  phone: phoneSchema,
  category: categorySchema.optional(), // Optional in send-otp, required in verify-otp
});

// Verify OTP Schema (category is optional - required only for new registrations)
export const verifyOTPSchema = Joi.object({
  phone: phoneSchema,
  otp: otpSchema,
  category: categorySchema.optional(), // Optional - required only if user doesn't exist
});

// Non-Degree Holder Registration Schema
// Supports both: state/city (names) OR stateId/cityId (IDs from dropdowns)
export const nonDegreeRegistrationSchema = Joi.object({
  phone: phoneSchema,
  // Option 1: State and City names (backward compatible)
  state: stateSchema.optional(),
  city: citySchema.optional(),
  // Option 2: State and City IDs (from dropdowns)
  stateId: stateIdSchema,
  cityId: cityIdSchema,
  specializationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid specialization ID",
      "any.required": "Specialization is required",
    }),
  selectedSkills: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one skill must be selected",
      "any.required": "Skills are required",
    }),
}).or("state", "stateId").or("city", "cityId").messages({
  "object.missing": "Either state/stateId and city/cityId are required",
});

// Step 1 Registration Schema (Diploma/ITI Holder)
export const step1RegistrationSchema = Joi.object({
  phone: phoneSchema,
  // category is optional - already set in verify-otp and stored in job seeker record
  // Files will be handled separately via multer
});

// Step 2 Registration Schema (Diploma/ITI Holder)
export const step2RegistrationSchema = Joi.object({
  phone: phoneSchema.optional(),
  jobSeekerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid job seeker ID",
    }),
  specializationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid specialization ID",
      "any.required": "Specialization is required",
    }),
  selectedSkills: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one skill must be selected",
      "any.required": "Skills are required",
    }),
  questionAnswers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required(),
        selectedOption: Joi.string().trim().required(),
        // Optional fields for backward compatibility
        questionText: Joi.string().trim().optional(),
        isCorrect: Joi.boolean().optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one question must be answered",
      "any.required": "Question answers are required",
    }),
  role: Joi.string()
    .valid("Worker", "Contractor", "Admin")
    .default("Worker")
    .optional(),
}).or("phone", "jobSeekerId"); // At least one of phone or jobSeekerId is required

// Step 3 Registration Schema (Diploma/ITI Holder)
// Supports stateId/cityId/yearOfPassing from dropdowns OR state/city/yearOfPassing as names
// Supports percentageOrGrade as separate field OR inside education object
export const step3RegistrationSchema = Joi.object({
  phone: phoneSchema.optional(),
  jobSeekerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid job seeker ID",
    }),
  education: Joi.object({
    collegeInstituteName: Joi.string().trim().min(1).required(),
    // Option 1: City and State names (backward compatible)
    city: Joi.string().trim().min(1).optional(),
    state: Joi.string().trim().min(1).optional(),
    yearOfPassing: Joi.string().trim().min(1).optional(), // Optional if provided separately
    percentageOrGrade: Joi.string().trim().min(1).optional(), // Optional if provided separately
  }).required(),
  // Option 2: State and City IDs (from dropdowns)
  stateId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid state ID",
    }),
  cityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid city ID",
    }),
  // Option 3: Year of Passing (from years API - just the year value like "2023")
  yearOfPassing: Joi.string().trim().min(1).optional(), // Separate field option
  // Option 4: Percentage/Grade (separate field)
  percentageOrGrade: Joi.string().trim().min(1).optional(), // Separate field option
  experienceStatus: Joi.object({
    hasExperience: Joi.boolean().required(),
    isFresher: Joi.boolean().required(),
  }).required(),
  // Files (resume, documents, experienceCertificate) will be handled via multer
})
  .or("phone", "jobSeekerId") // At least one of phone or jobSeekerId is required
  .or("education.state", "stateId") // At least one of state or stateId
  .or("education.city", "cityId") // At least one of city or cityId
  .or("education.yearOfPassing", "yearOfPassing"); // At least one of yearOfPassing in education or separate

// Get Specialization Skills Schema
export const getSpecializationSkillsSchema = Joi.object({
  specializationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid specialization ID",
      "any.required": "Specialization ID is required",
    }),
});

// Get Skills by Category Schema
export const getSkillsByCategorySchema = Joi.object({
  category: Joi.string()
    .valid("Non-Degree Holder", "Diploma Holder", "ITI Holder")
    .required()
    .messages({
      "any.only": "Category must be one of: Non-Degree Holder, Diploma Holder, ITI Holder",
      "any.required": "Category is required",
    }),
});

