import ApiResponse from "../../../utils/ApiResponse.js";
import ApiError from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { RecruiterJob } from "../../../models/recruiter/jobPost/jobPost.model.js";
import { City } from "../../../models/location/city.model.js";
import { Recruiter } from "../../../models/recruiter/recruiter.model.js";

const normalizeArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

/**
 * Parse salary from search term
 * Handles formats like: "50k", "5 lakhs", "50000", "50,000", "5L", etc.
 * Returns salary in monthly format (converts annual to monthly if needed)
 */
const parseSalaryFromSearch = (searchTerm) => {
  // Remove common words and extract numbers
  const cleaned = searchTerm.toLowerCase()
    .replace(/[,\s]/g, '') // Remove commas and spaces
    .replace(/lakhs?/gi, '00000') // Convert "lakhs" to 00000
    .replace(/l/gi, '00000') // Convert "L" or "l" to 00000
    .replace(/k/gi, '000') // Convert "k" to 000
    .replace(/thousand/gi, '000'); // Convert "thousand" to 000
  
  // Extract number from string
  const numberMatch = cleaned.match(/\d+/);
  if (!numberMatch) return null;
  
  let salary = parseFloat(numberMatch[0]);
  
  // If the original search term contains "lakh" or "LPA" or "per annum", it's likely annual
  const isAnnual = /lakh|lpa|per\s*annum|annual|yearly/gi.test(searchTerm);
  
  // Convert annual to monthly if needed (divide by 12)
  if (isAnnual && salary > 10000) {
    salary = Math.round(salary / 12);
  }
  
  return salary;
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

/**
 * Get All Job Posts (Public endpoint)
 * Returns all active job posts with optional filtering and pagination
 * Used by job seekers to browse available jobs
 */
export const getAllJobPosts = asyncHandler(async (req, res) => {
  const {
    status = "Open", // Default to "Open" jobs only
    city, // City name (string) - for backward compatibility
    cityId, // Single city ID (string)
    cityIds, // Multiple city IDs (comma-separated string or array)
    jobType,
    employmentMode,
    category,
    minSalary,
    maxSalary,
    experienceMin,
    experienceMax,
    search, // Global search query - searches across multiple fields
    q, // Alternative search parameter (same as search)
    page = 1,
    limit = 10,
    sortBy = "createdAt", // createdAt, salary, experience, relevance
    sortOrder = "desc", // asc, desc
  } = req.query;

  // Build filter object
  const filter = {};
  
  // Global search - searches across job title, description, city, company name, categories, tags, qualifications
  const searchTerm = search || q;
  let searchFilter = null;
  let recruiterIdsForSearch = [];
  
  if (searchTerm && searchTerm.trim()) {
    const trimmedSearch = searchTerm.trim();
    const searchRegex = new RegExp(trimmedSearch, "i"); // Case-insensitive
    
    // Parse salary from search term
    const parsedSalary = parseSalaryFromSearch(trimmedSearch);
    
    // Check if search is purely a salary number (no other text)
    const isPureSalarySearch = /^[\d,\s]+(k|l|L|lakhs?|lpa|per\s*annum|annual|yearly)?$/i.test(trimmedSearch) && parsedSalary && parsedSalary > 0;
    
    // Search in recruiter company names
    const matchingRecruiters = await Recruiter.find({
      companyName: { $regex: searchRegex }
    }).select("_id").lean();
    
    recruiterIdsForSearch = matchingRecruiters.map(r => r._id);
    
    // Build comprehensive search filter using $or
    const searchConditions = [];
    
    // If it's a pure salary search, prioritize salary matching and be strict
    if (isPureSalarySearch && parsedSalary) {
      // For pure salary searches, only match jobs where:
      // 1. Searched salary falls within job's salary range, OR
      // 2. Job's salary range significantly overlaps with searched salary range (±15% tolerance)
      // This ensures we don't match jobs that are too far off (like 50k-80k when searching 100k)
      
      // Condition 1: Searched salary falls within job's range
      searchConditions.push({
        $and: [
          { "expectedSalary.min": { $lte: parsedSalary } },
          { "expectedSalary.max": { $gte: parsedSalary } }
        ]
      });
      
      // Condition 2: Job's salary range significantly overlaps with searched salary
      // Use ±15% tolerance - job's range should overlap with [85k, 115k] when searching 100k
      const tolerance = parsedSalary * 0.15; // 15% tolerance (stricter)
      const minSalary = Math.max(0, parsedSalary - tolerance);
      const maxSalary = parsedSalary + tolerance;
      
      // Match if job's salary range overlaps with the tolerance range
      // Job range overlaps if: job.min <= tolerance.max AND job.max >= tolerance.min
      searchConditions.push({
        $and: [
          { "expectedSalary.min": { $lte: maxSalary } },
          { "expectedSalary.max": { $gte: minSalary } }
        ]
      });
    } else {
      // Regular text search - search in all fields
      searchConditions.push(
        // Job title search
        { jobTitle: { $regex: searchRegex } },
        // Job description search
        { jobDescription: { $regex: searchRegex } },
        // City search
        { city: { $regex: searchRegex } },
        // Categories search (array field - regex matches any element)
        { categories: searchRegex },
        // Tags search (array field - regex matches any element)
        { tags: searchRegex },
        // Qualifications search (array field - regex matches any element)
        { qualifications: searchRegex },
        // Responsibilities search (array field - regex matches any element)
        { responsibilities: searchRegex },
        // Company name from companySnapshot
        { "companySnapshot.name": { $regex: searchRegex } },
        // Company name from recruiter (if recruiter IDs found)
        ...(recruiterIdsForSearch.length > 0 ? [{ recruiter: { $in: recruiterIdsForSearch } }] : [])
      );
      
      // Add salary search if a valid salary number is found in search term (for mixed searches)
      if (parsedSalary && parsedSalary > 0) {
        // For mixed searches, be more lenient - match if searched salary is within range or close
        searchConditions.push({
          $or: [
            // Search salary falls within job's salary range
            {
              $and: [
                { "expectedSalary.min": { $lte: parsedSalary } },
                { "expectedSalary.max": { $gte: parsedSalary } }
              ]
            },
            // Job's salary range overlaps with searched salary (within 30% tolerance)
            {
              $or: [
                {
                  "expectedSalary.min": {
                    $gte: Math.max(0, parsedSalary * 0.7),
                    $lte: parsedSalary * 1.3
                  }
                },
                {
                  "expectedSalary.max": {
                    $gte: Math.max(0, parsedSalary * 0.7),
                    $lte: parsedSalary * 1.3
                  }
                }
              ]
            }
          ]
        });
      }
    }
    
    searchFilter = {
      $or: searchConditions
    };
  }

  // Status filter (default to "Open" jobs)
  if (status) {
    if (status === "all") {
      // If "all" is specified, don't filter by status
    } else {
      filter.status = status;
    }
  } else {
    filter.status = "Open"; // Default to open jobs
  }

  // City filter - supports both city ID(s) and city name(s)
  let cityNames = [];
  
  // Priority 1: If cityIds (multiple) is provided
  if (cityIds) {
    const cityIdArray = Array.isArray(cityIds) 
      ? cityIds 
      : typeof cityIds === "string" 
        ? cityIds.split(",").map(id => id.trim()).filter(Boolean)
        : [];
    
    if (cityIdArray.length > 0) {
      const cities = await City.find({ 
        _id: { $in: cityIdArray },
        status: "Active" 
      }).select("name").lean();
      
      cityNames = cities.map(c => c.name);
    }
  }
  // Priority 2: If cityId (single) is provided
  else if (cityId) {
    const city = await City.findById(cityId).select("name").lean();
    if (city) {
      cityNames = [city.name];
    }
  }
  // Priority 3: If city (name) is provided (backward compatibility)
  else if (city) {
    // Support comma-separated city names or single city name
    if (typeof city === "string" && city.includes(",")) {
      cityNames = city.split(",").map(c => c.trim()).filter(Boolean);
    } else {
      cityNames = [city];
    }
  }

  // Apply city filter
  let cityFilter = null;
  if (cityNames.length > 0) {
    if (cityNames.length === 1) {
      // Single city - use regex for partial matching
      filter.city = { $regex: new RegExp(cityNames[0], "i") };
    } else {
      // Multiple cities - create $or filter
      cityFilter = {
        $or: cityNames.map(cityName => ({
          city: { $regex: new RegExp(cityName, "i") }
        }))
      };
    }
  }

  // Job Type filter
  if (jobType) {
    filter.jobType = jobType;
  }

  // Employment Mode filter
  if (employmentMode) {
    filter.employmentMode = employmentMode;
  }

  // Category filter
  if (category) {
    filter.categories = { $in: [category] };
  }

  // Salary range filter
  if (minSalary || maxSalary) {
    filter["expectedSalary.min"] = {};
    if (minSalary) {
      filter["expectedSalary.min"].$gte = Number(minSalary);
    }
    if (maxSalary) {
      filter["expectedSalary.max"] = {};
      filter["expectedSalary.max"].$lte = Number(maxSalary);
    }
  }

  // Experience range filter
  let experienceFilter = null;
  if (experienceMin !== undefined || experienceMax !== undefined) {
    if (experienceMin !== undefined && experienceMax !== undefined) {
      // Find jobs where experience range overlaps with requested range
      experienceFilter = {
        $or: [
          {
            $and: [
              { "experienceRange.minYears": { $lte: Number(experienceMax) } },
              { "experienceRange.maxYears": { $gte: Number(experienceMin) } },
            ]
          },
          {
            $and: [
              { "experienceRange.minYears": { $gte: Number(experienceMin), $lte: Number(experienceMax) } },
              { "experienceRange.maxYears": null },
            ]
          }
        ]
      };
    } else if (experienceMin !== undefined) {
      filter["experienceRange.minYears"] = { $lte: Number(experienceMin) };
    } else if (experienceMax !== undefined) {
      experienceFilter = {
        $or: [
          { "experienceRange.maxYears": { $gte: Number(experienceMax) } },
          { 
            $and: [
              { "experienceRange.maxYears": null },
              { "experienceRange.minYears": { $lte: Number(experienceMax) } }
            ]
          },
        ]
      };
    }
  }

  // Combine all filters
  const filtersToCombine = [];
  
  // Add search filter if exists
  if (searchFilter) {
    filtersToCombine.push(searchFilter);
  }
  
  // Add city filter if exists
  if (cityFilter) {
    filtersToCombine.push(cityFilter);
  }
  
  // Add experience filter if exists
  if (experienceFilter) {
    filtersToCombine.push(experienceFilter);
  }
  
  // Combine filters using $and if multiple $or filters exist
  if (filtersToCombine.length > 0) {
    if (filtersToCombine.length === 1) {
      // Single filter - merge directly
      Object.assign(filter, filtersToCombine[0]);
    } else {
      // Multiple filters - use $and
      filter.$and = [
        ...filtersToCombine,
        ...(filter.$and || [])
      ];
    }
  }

  // Pagination
  const pageNumber = Math.max(1, parseInt(page));
  const limitNumber = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
  const skip = (pageNumber - 1) * limitNumber;

  // Sort options
  const sortOptions = {};
  if (sortBy === "salary") {
    sortOptions["expectedSalary.min"] = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "experience") {
    sortOptions["experienceRange.minYears"] = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "relevance" && searchTerm) {
    // For relevance sorting, we'll sort by createdAt as a fallback
    // In a production system, you might want to use MongoDB text search score
    sortOptions["createdAt"] = -1; // Most recent first when searching
  } else {
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
  }

  // Fetch jobs with pagination
  const jobs = await RecruiterJob.find(filter)
    .populate("recruiter", "companyName companyLogo city state email phone")
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNumber)
    .lean();

  // Get total count for pagination
  const totalJobs = await RecruiterJob.countDocuments(filter);
  const totalPages = Math.ceil(totalJobs / limitNumber);

  // Format jobs with summary
  const formattedJobs = jobs.map((job) => {
    const salaryLabel = `₹${Math.round(job.expectedSalary.min).toLocaleString("en-IN")} - ₹${Math.round(
      job.expectedSalary.max
    ).toLocaleString("en-IN")}/${job.expectedSalary.payPeriod === "monthly" ? "month" : "year"}`;

    const experienceLabel = job.experienceRange.maxYears
      ? `${job.experienceRange.minYears}-${job.experienceRange.maxYears} YoE`
      : `${job.experienceRange.minYears}+ YoE`;

    return {
      _id: job._id,
      jobTitle: job.jobTitle,
      jobDescription: job.jobDescription,
      city: job.city,
      expectedSalary: job.expectedSalary,
      salaryLabel,
      employeeCount: job.employeeCount,
      jobType: job.jobType,
      employmentMode: job.employmentMode,
      categories: job.categories,
      tags: job.tags,
      benefits: job.benefits,
      experienceRange: job.experienceRange,
      experienceLabel,
      qualifications: job.qualifications,
      responsibilities: job.responsibilities,
      companySnapshot: job.companySnapshot,
      recruiter: job.recruiter,
      status: job.status,
      applicationCount: job.applicationCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      summary: {
        salaryLabel,
        experienceLabel,
        jobTags: [
          job.jobType,
          job.employmentMode,
          experienceLabel,
        ],
      },
    };
  });

  return res.status(200).json(
    ApiResponse.success(
      {
        jobs: formattedJobs,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalJobs,
          limit: limitNumber,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
        },
        filters: {
          status: status === "all" ? "all" : filter.status,
          city: cityNames.length > 0 ? (cityNames.length === 1 ? cityNames[0] : cityNames) : null,
          cityId: cityId || null,
          cityIds: cityIds ? (Array.isArray(cityIds) ? cityIds : cityIds.split(",").map(id => id.trim())) : null,
          jobType: jobType || null,
          employmentMode: employmentMode || null,
          category: category || null,
        },
        search: {
          query: searchTerm || null,
          hasSearch: !!searchTerm,
          totalResults: totalJobs,
        },
      },
      searchTerm 
        ? `Found ${totalJobs} job${totalJobs !== 1 ? "s" : ""} for "${searchTerm}"`
        : "Jobs fetched successfully"
    )
  );
});

