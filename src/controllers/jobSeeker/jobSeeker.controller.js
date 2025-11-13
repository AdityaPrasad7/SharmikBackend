import mongoose from "mongoose";
import { JobSeeker } from "../../models/jobSeeker/jobSeeker.model.js";
import { Specialization } from "../../models/admin/specialization/specialization.model.js";
import { QuestionSet } from "../../models/admin/questionSet/questionSet.model.js";
import { Category } from "../../models/category/category.model.js";
import { State } from "../../models/location/state.model.js";
import { City } from "../../models/location/city.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { storeOTP, verifyOTP as verifyOTPFromService } from "../../utils/otpService.js";
import { getFileUrl } from "../../middlewares/fileUpload.js";

/**
 * Send OTP for mobile verification
 * Supports both Registration and Login flows:
 * - Registration: User doesn't exist, category provided
 * - Login: User exists, no category needed
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { phone, category } = req.body;

  // Check if job seeker already exists
  const existingJobSeeker = await JobSeeker.findOne({ phone });
  
  // Determine purpose: "login" if user exists, "registration" if new user
  const purpose = existingJobSeeker ? "login" : "registration";
  
  // For registration, category is optional (can be sent in verify-otp)
  // For login, category is not needed
  if (existingJobSeeker && category) {
    // User exists but category provided - might be trying to change category
    // This is allowed, will be handled in verify-otp
  }

  // Generate and store OTP
  const otp = await storeOTP(phone, purpose);

  // In production, send OTP via SMS service here
  // For now, we'll return it in response for testing
  console.log(`OTP for ${phone} (${purpose}): ${otp}`);

  // Return OTP if:
  // 1. Development mode, OR
  // 2. RETURN_OTP_IN_RESPONSE env variable is set to true, OR
  // 3. OTP is "1234" (testing mode)
  const shouldReturnOTP = 
    process.env.NODE_ENV === "development" || 
    process.env.RETURN_OTP_IN_RESPONSE === "true" ||
    otp === "1234";

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { 
          otp: shouldReturnOTP ? otp : undefined,
          isExistingUser: !!existingJobSeeker // Indicate if user exists (for frontend logic)
        },
        "OTP sent successfully"
      )
    );
});

/**
 * Verify OTP
 * Smart verification:
 * - If user exists: Login flow (category optional, can update if provided)
 * - If user doesn't exist: Registration flow (category required)
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, category } = req.body;

  // Check if user exists to determine OTP purpose
  let jobSeeker = await JobSeeker.findOne({ phone });
  const purpose = jobSeeker ? "login" : "registration";

  // Verify OTP with correct purpose
  const isValid = await verifyOTPFromService(phone, otp, purpose);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  
  if (!jobSeeker) {
    // New user - Registration flow: category is REQUIRED
    if (!category) {
      throw new ApiError(400, "Category is required for new user registration");
    }
    
    jobSeeker = await JobSeeker.create({
      phone,
      phoneVerified: true,
      category,
      registrationStep: 1,
    });
  } else {
    // Existing user - Login flow: category is optional
    // If category provided, update it (user might be changing category)
    // If not provided, keep existing category
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

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker },
        "OTP verified successfully"
      )
    );
});

/**
 * Register Non-Degree Holder (Complete registration in one step)
 * Supports both state/city names and stateId/cityId from dropdowns
 */
export const registerNonDegree = asyncHandler(async (req, res) => {
  const { phone, state, city, stateId, cityId, specializationId, selectedSkills } = req.body;
  console.log("registerNonDegree req.body:", req.body);

  // Find job seeker
  let jobSeeker = await JobSeeker.findOne({ phone });
  if (!jobSeeker || !jobSeeker.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number first");
  }

  if (jobSeeker.category !== "Non-Degree Holder") {
    throw new ApiError(400, "Invalid category for this registration");
  }

  // Verify specialization exists
  const specialization = await Specialization.findById(specializationId);
  if (!specialization) {
    throw new ApiError(404, "Specialization not found");
  }

  // Verify skills belong to specialization
  const specializationSkills = specialization.skills || [];
  const invalidSkills = selectedSkills.filter(
    (skill) => !specializationSkills.includes(skill)
  );
  if (invalidSkills.length > 0) {
    throw new ApiError(
      400,
      `Invalid skills: ${invalidSkills.join(", ")}. Skills must belong to the selected specialization.`
    );
  }

  // Resolve state and city names from IDs if provided
  let stateName = state;
  let cityName = city;

  if (stateId && !stateName) {
    const stateDoc = await State.findById(stateId);
    if (!stateDoc) {
      throw new ApiError(404, "State not found");
    }
    stateName = stateDoc.name;
  }

  if (cityId && !cityName) {
    const cityDoc = await City.findById(cityId);
    if (!cityDoc) {
      throw new ApiError(404, "City not found");
    }
    cityName = cityDoc.name;
    
    // Verify city belongs to the selected state
    if (stateId && cityDoc.stateId.toString() !== stateId) {
      throw new ApiError(400, "City does not belong to the selected state");
    }
  }

  if (!stateName || !cityName) {
    throw new ApiError(400, "State and city are required");
  }

  // Handle file uploads
  const aadhaarCard = req.files?.aadhaarCard?.[0]
    ? getFileUrl(req.files.aadhaarCard[0])
    : null;
  const profilePhoto = req.files?.profilePhoto?.[0]
    ? getFileUrl(req.files.profilePhoto[0])
    : null;

  if (!aadhaarCard) {
    throw new ApiError(400, "Aadhaar card is required");
  }

  if (!profilePhoto) {
    throw new ApiError(400, "Profile photo is required");
  }

  // Update job seeker
  jobSeeker.state = stateName;
  jobSeeker.city = cityName;
  jobSeeker.specializationId = specializationId;
  jobSeeker.selectedSkills = selectedSkills; // Only store selected skills (user's known skills)
  jobSeeker.aadhaarCard = aadhaarCard;
  jobSeeker.profilePhoto = profilePhoto;
  jobSeeker.registrationStep = 4;
  jobSeeker.isRegistrationComplete = true;
  jobSeeker.status = "Pending";

  await jobSeeker.save();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker },
        "Registration completed successfully"
      )
    );
});

/**
 * Step 1 Registration (Diploma/ITI Holder) - Upload Aadhaar and Profile Photo
 */
export const step1Registration = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  // Find job seeker
  let jobSeeker = await JobSeeker.findOne({ phone });
  if (!jobSeeker || !jobSeeker.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number first");
  }

  if (
    jobSeeker.category !== "Diploma Holder" &&
    jobSeeker.category !== "ITI Holder"
  ) {
    throw new ApiError(400, "Invalid category for this registration step");
  }

  // Handle file uploads
  const aadhaarCard = req.files?.aadhaarCard?.[0]
    ? getFileUrl(req.files.aadhaarCard[0])
    : null;
  const profilePhoto = req.files?.profilePhoto?.[0]
    ? getFileUrl(req.files.profilePhoto[0])
    : null;

  if (!aadhaarCard) {
    throw new ApiError(400, "Aadhaar card is required");
  }

  if (!profilePhoto) {
    throw new ApiError(400, "Profile photo is required");
  }

  // Update job seeker
  jobSeeker.aadhaarCard = aadhaarCard;
  jobSeeker.profilePhoto = profilePhoto;
  jobSeeker.registrationStep = 2;

  await jobSeeker.save();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker },
        "Step 1 completed successfully"
      )
    );
});

/**
 * Step 2 Registration (Diploma/ITI Holder) - Select Trade, Skills, and Answer Questions
 */
export const step2Registration = asyncHandler(async (req, res) => {
  const { phone, jobSeekerId, specializationId, selectedSkills, questionAnswers, role } =
    req.body;

  // Find job seeker - prefer jobSeekerId over phone
  let jobSeeker;
  if (jobSeekerId) {
    jobSeeker = await JobSeeker.findById(jobSeekerId);
  } else if (phone) {
    jobSeeker = await JobSeeker.findOne({ phone });
  } else {
    throw new ApiError(400, "Either jobSeekerId or phone is required");
  }

  if (!jobSeeker || !jobSeeker.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number first");
  }

  if (jobSeeker.registrationStep < 2) {
    throw new ApiError(400, "Please complete step 1 first");
  }

  // Verify specialization exists
  const specialization = await Specialization.findById(specializationId);
  if (!specialization) {
    throw new ApiError(404, "Specialization not found");
  }

  // Verify skills belong to specialization
  const specializationSkills = specialization.skills || [];
  const invalidSkills = selectedSkills.filter(
    (skill) => !specializationSkills.includes(skill)
  );
  if (invalidSkills.length > 0) {
    throw new ApiError(
      400,
      `Invalid skills: ${invalidSkills.join(", ")}. Skills must belong to the selected specialization.`
    );
  }

  // Get question set for this specialization
  // Check if specializationId is in the specializationIds array
  // Convert specializationId to ObjectId for proper matching
  const specializationObjectId = new mongoose.Types.ObjectId(specializationId);
  const questionSet = await QuestionSet.findOne({
    specializationIds: { $in: [specializationObjectId] },
  });

  if (!questionSet) {
    throw new ApiError(
      404,
      `No question set found for this specialization. Please ask admin to create a question set for specialization ID: ${specializationId}`
    );
  }

  if (!questionSet.questions || questionSet.questions.length === 0) {
    throw new ApiError(
      404,
      `Question set found but it has no questions. Please ask admin to add questions to the question set.`
    );
  }

  // Validate that all questions are answered
  const questionSetQuestions = questionSet.questions || [];
  if (questionAnswers.length !== questionSetQuestions.length) {
    throw new ApiError(
      400,
      `Please answer all ${questionSetQuestions.length} questions`
    );
  }

  // Process question answers and mark correct/incorrect
  const processedAnswers = questionAnswers.map((answer, index) => {
    // Try to find question by text first, then by index
    let question = questionSetQuestions.find(
      (q) => q.text.trim().toLowerCase() === answer.questionText?.trim().toLowerCase()
    );
    
    // If not found by text, try by index
    if (!question && index < questionSetQuestions.length) {
      question = questionSetQuestions[index];
    }
    
    if (!question) {
      throw new ApiError(400, `Question not found: ${answer.questionText || `at index ${index}`}`);
    }

    // Find the correct option
    const correctOption = question.options.find((opt) => opt.isCorrect);
    const isCorrect = correctOption && 
      correctOption.text.trim().toLowerCase() === answer.selectedOption?.trim().toLowerCase();

    return {
      questionId: answer.questionId || question.text || `question_${index}`,
      questionText: question.text,
      selectedOption: answer.selectedOption,
      isCorrect: isCorrect || false,
    };
  });

  // Update job seeker
  jobSeeker.specializationId = specializationId;
  jobSeeker.selectedSkills = selectedSkills;
  jobSeeker.skills = selectedSkills;
  jobSeeker.questionAnswers = processedAnswers;
  jobSeeker.role = role || "Worker";
  jobSeeker.registrationStep = 3;

  await jobSeeker.save();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker },
        "Step 2 completed successfully"
      )
    );
});

/**
 * Step 3 Registration (Diploma/ITI Holder) - Education and Experience Details
 */
export const step3Registration = asyncHandler(async (req, res) => {
  const { phone, jobSeekerId, education, experienceStatus } = req.body;

  // Find job seeker - prefer jobSeekerId over phone
  let jobSeeker;
  if (jobSeekerId) {
    jobSeeker = await JobSeeker.findById(jobSeekerId);
  } else if (phone) {
    jobSeeker = await JobSeeker.findOne({ phone });
  } else {
    throw new ApiError(400, "Either jobSeekerId or phone is required");
  }

  if (!jobSeeker || !jobSeeker.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number first");
  }

  if (jobSeeker.registrationStep < 3) {
    throw new ApiError(400, "Please complete step 2 first");
  }

  // Handle file uploads
  const resume = req.files?.resume?.[0]
    ? getFileUrl(req.files.resume[0])
    : null;
  const experienceCertificate = req.files?.experienceCertificate?.[0]
    ? getFileUrl(req.files.experienceCertificate[0])
    : null;
  const documents = req.files?.documents
    ? req.files.documents.map((file) => getFileUrl(file))
    : [];

  if (!resume) {
    throw new ApiError(400, "Resume is required");
  }

  // If has experience, experience certificate is required
  if (experienceStatus.hasExperience && !experienceStatus.isFresher) {
    if (!experienceCertificate) {
      throw new ApiError(400, "Experience certificate is required when you have experience");
    }
  }

  // Update job seeker
  jobSeeker.education = education;
  jobSeeker.experienceStatus = experienceStatus;
  jobSeeker.resume = resume;
  if (experienceCertificate) {
    jobSeeker.experienceCertificate = experienceCertificate;
  }
  if (documents.length > 0) {
    jobSeeker.documents = documents;
  }
  jobSeeker.registrationStep = 4;
  jobSeeker.isRegistrationComplete = true;
  jobSeeker.status = "Pending";

  await jobSeeker.save();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker },
        "Registration completed successfully"
      )
    );
});

/**
 * Get Available Categories (Public endpoint for registration)
 * Fetches active categories from database
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ status: "Active" })
    .select("name description status")
    .sort({ name: 1 })
    .lean();

  // Format for frontend compatibility
  const formattedCategories = categories.map((cat) => ({
    value: cat.name,
    label: cat.name,
    description: cat.description || "",
  }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { categories: formattedCategories },
        "Categories fetched successfully"
      )
    );
});

/**
 * Get All Specializations (Public endpoint for registration)
 * Returns all specializations formatted for dropdown selection
 */
export const getAllSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Specialization.find({ status: "Active" })
    .select("name skills status")
    .sort({ name: 1 })
    .lean();

  // Format for dropdown (just names and IDs)
  const formattedSpecializations = specializations.map((spec) => ({
    _id: spec._id,
    value: spec._id.toString(),
    label: spec.name,
    name: spec.name,
  }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { specializations: formattedSpecializations },
        "Specializations fetched successfully"
      )
    );
});

/**
 * Get Specialization with Skills and Questions
 * Used when user selects a specialization from dropdown
 * Returns all skills for that specialization (for user to select from)
 * Also returns questions related to that specialization
 */
export const getSpecializationSkills = asyncHandler(async (req, res) => {
  const { specializationId } = req.params;

  const specialization = await Specialization.findById(specializationId).lean();
  if (!specialization) {
    throw new ApiError(404, "Specialization not found");
  }

  // Get question set for this specialization
  // Check if specializationId is in the specializationIds array
  // Convert specializationId to ObjectId for proper matching
  const specializationObjectId = new mongoose.Types.ObjectId(specializationId);
  const questionSet = await QuestionSet.findOne({
    specializationIds: { $in: [specializationObjectId] },
  }).lean();

  // Format skills for frontend selection (all available skills from this specialization)
  const allSkills = (specialization.skills || []).map((skill) => ({
    value: skill,
    label: skill,
  }));

  // Format questions with auto-generated questionId for frontend
  const formattedQuestions = questionSet
    ? (questionSet.questions || []).map((question, index) => ({
        questionId: `q${index + 1}`, // Auto-generated questionId: "q1", "q2", "q3", etc.
        text: question.text,
        options: question.options || [],
      }))
    : [];

  return res
    .status(200)
    .json(
      ApiResponse.success(
        {
          specialization: {
            _id: specialization._id,
            name: specialization.name,
            skills: specialization.skills || [], // Raw skills array
            allSkills: allSkills, // Formatted for frontend selection
          },
          questionSet: questionSet
            ? {
                _id: questionSet._id,
                name: questionSet.name,
                questions: formattedQuestions, // Questions with auto-generated questionId
                totalQuestions: questionSet.totalQuestions || 0,
              }
            : null,
        },
        "Specialization, skills, and questions fetched successfully"
      )
    );
});

/**
 * Get Skills by Category
 * Returns all skills from the specialization matching the category
 * Used for Non-Degree Holder registration to show all available skills
 */
export const getSkillsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;

  if (!category) {
    throw new ApiError(400, "Category is required");
  }

  // Map category names to specialization names
  // "Non-Degree Holder" -> "Non-Degree"
  // "Diploma Holder" -> "Diploma"
  // "ITI Holder" -> "ITI"
  const categoryToSpecializationMap = {
    "Non-Degree Holder": "Non-Degree",
    "Diploma Holder": "Diploma",
    "ITI Holder": "ITI",
  };

  const specializationName = categoryToSpecializationMap[category];

  if (!specializationName) {
    throw new ApiError(
      400,
      `Invalid category. Valid categories: ${Object.keys(categoryToSpecializationMap).join(", ")}`
    );
  }

  // Find specialization by name (case-insensitive, exact match preferred)
  let specialization = await Specialization.findOne({
    name: { $regex: new RegExp(`^${specializationName}$`, "i") },
    status: "Active",
  }).lean();

  // If exact match not found, try partial match
  if (!specialization) {
    specialization = await Specialization.findOne({
      name: { $regex: new RegExp(specializationName, "i") },
      status: "Active",
    }).lean();
  }

  if (!specialization) {
    throw new ApiError(
      404,
      `No active specialization found for category: ${category}. Please ask admin to create a "${specializationName}" specialization.`
    );
  }

  // Format skills for frontend selection (all available skills)
  const allSkills = (specialization.skills || []).map((skill) => ({
    value: skill,
    label: skill,
  }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        {
          category: category,
          specialization: {
            _id: specialization._id,
            name: specialization.name,
            allSkills: allSkills, // All available skills formatted for frontend (user can select from these)
          },
        },
        "Skills fetched successfully"
      )
    );
});

/**
 * Get Job Seeker by Phone
 */
export const getJobSeekerByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  const jobSeeker = await JobSeeker.findOne({ phone })
    .populate("specializationId", "name skills")
    .lean();

  if (!jobSeeker) {
    throw new ApiError(404, "Job seeker not found");
  }

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker },
        "Job seeker fetched successfully"
      )
    );
});

