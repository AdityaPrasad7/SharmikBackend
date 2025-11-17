import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { RecruiterJob } from "../../models/recruiter/recruiterJob.model.js";

const normalizeArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const buildCompanySnapshot = (recruiter, payload = {}) => {
  const snapshot = {
    name: payload.name || recruiter.companyName || "",
    industry: payload.industry || "",
    employeeCount: payload.employeesCount || payload.employeeCount || "",
    location:
      payload.location ||
      [recruiter.city, recruiter.state].filter(Boolean).join(", ") ||
      "",
    description: payload.description || "",
    logo: recruiter.companyLogo || recruiter.profilePhoto || "",
  };

  Object.keys(snapshot).forEach((key) => {
    if (snapshot[key] === undefined) {
      snapshot[key] = "";
    }
  });

  return snapshot;
};

export const createRecruiterJob = asyncHandler(async (req, res) => {
  const recruiter = req.recruiter;

  if (!recruiter?.phoneVerified) {
    throw new ApiError(400, "Please complete recruiter verification first.");
  }

  const {
    jobTitle,
    jobDescription,
    city,
    expectedSalaryMin,
    expectedSalaryMax,
    salaryCurrency = "INR",
    salaryPayPeriod = "monthly",
    employeeCount,
    jobType,
    employmentMode,
    categories,
    tags,
    benefits = {},
    experienceMinYears = 0,
    experienceMaxYears,
    qualifications = [],
    responsibilities = [],
    aboutCompany = {},
  } = req.body;

  const normalizedCategories = normalizeArray(categories);
  const normalizedTags = normalizeArray(tags);
  const normalizedQualifications = normalizeArray(qualifications);
  const normalizedResponsibilities = normalizeArray(responsibilities);

  const job = await RecruiterJob.create({
    recruiter: recruiter._id,
    jobTitle,
    jobDescription,
    city,
    expectedSalary: {
      min: expectedSalaryMin,
      max: expectedSalaryMax,
      currency: salaryCurrency,
      payPeriod: salaryPayPeriod,
    },
    employeeCount,
    jobType,
    employmentMode,
    categories: normalizedCategories,
    tags: normalizedTags,
    benefits: {
      foodProvided: benefits.foodProvided ?? false,
      accommodationProvided: benefits.accommodationProvided ?? false,
      travelFacility: benefits.travelFacility ?? false,
    },
    experienceRange: {
      minYears: experienceMinYears,
      maxYears: experienceMaxYears ?? null,
    },
    qualifications: normalizedQualifications,
    responsibilities: normalizedResponsibilities,
    companySnapshot: buildCompanySnapshot(recruiter, aboutCompany),
  });

  const responsePayload = {
    job,
    summary: {
      salaryLabel: `₹${Math.round(expectedSalaryMin).toLocaleString("en-IN")} - ₹${Math.round(
        expectedSalaryMax
      ).toLocaleString("en-IN")}/${salaryPayPeriod === "monthly" ? "month" : "year"}`,
      experienceLabel: experienceMaxYears
        ? `${experienceMinYears}-${experienceMaxYears} YoE`
        : `${experienceMinYears}+ YoE`,
      jobTags: [
        jobType,
        employmentMode,
        experienceMaxYears
          ? `${experienceMinYears}-${experienceMaxYears} YoE`
          : `${experienceMinYears}+ YoE`,
      ],
    },
  };

  return res
    .status(201)
    .json(ApiResponse.success(responsePayload, "Job posted successfully"));
});


