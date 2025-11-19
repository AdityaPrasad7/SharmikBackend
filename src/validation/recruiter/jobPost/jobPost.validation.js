import Joi from "joi";

const booleanField = Joi.boolean().default(false);

const benefitsSchema = Joi.object({
  foodProvided: booleanField,
  accommodationProvided: booleanField,
  travelFacility: booleanField,
})
  .required()
  .custom((value, helpers) => {
    // At least one facility must be selected (true)
    const hasFacility = 
      value.foodProvided === true || 
      value.accommodationProvided === true || 
      value.travelFacility === true;
    
    if (!hasFacility) {
      return helpers.error("any.custom", {
        message: "At least one facility must be selected",
      });
    }
    
    return value;
  })
  .messages({
    "any.required": "Facilities (benefits) are required",
    "any.custom": "At least one facility must be selected",
  });

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
  employeeCount: Joi.number().integer().min(1).required().messages({
    "any.required": "Employee count is required",
    "number.base": "Employee count must be a number",
    "number.integer": "Employee count must be an integer",
    "number.min": "Employee count must be at least 1",
  }),
  jobType: Joi.string().valid("Full Time", "Part Time", "Contract").required().messages({
    "any.required": "Job type is required",
    "any.only": "Job type must be one of: Full Time, Part Time, Contract",
  }),
  employmentMode: Joi.string().valid("Onsite", "Remote", "Hybrid").default("Onsite"),
  jobSeekerCategory: Joi.string()
    .valid("Non-Degree Holder", "Diploma Holder", "ITI Holder")
    .required()
    .messages({
      "any.required": "Job seeker category is required",
      "any.only": "Job seeker category must be one of: Non-Degree Holder, Diploma Holder, ITI Holder",
    }),
  categories: Joi.alternatives()
    .try(stringArray.min(1), Joi.string().trim().min(1))
    .required()
    .messages({
      "any.required": "At least one job category is required",
    }),
  tags: Joi.alternatives().try(stringArray, Joi.string().trim()),
  skills: Joi.alternatives()
    .try(stringArray.min(1), Joi.string().trim().min(1))
    .optional()
    .messages({
      "array.min": "At least one skill is required if skills are provided",
    }),
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

  ["categories", "tags", "skills", "qualifications", "responsibilities"].forEach(normalizeField);

  return cloned;
});

