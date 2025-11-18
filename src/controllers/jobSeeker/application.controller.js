import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Application } from "../../models/jobSeeker/application.model.js";
import { RecruiterJob } from "../../models/recruiter/jobPost/jobPost.model.js";
import { JobSeeker } from "../../models/jobSeeker/jobSeeker.model.js";

/**
 * Apply for a Job (Job Seeker)
 * Allows authenticated job seekers to apply for job posts
 */
export const applyForJob = asyncHandler(async (req, res) => {
  const jobSeeker = req.jobSeeker; // From auth middleware
  const { jobId, coverLetter, notes } = req.body;

  // Validate job ID
  if (!jobId) {
    throw new ApiError(400, "Job ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID format");
  }

  // Check if job exists and is open
  const job = await RecruiterJob.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.status !== "Open") {
    throw new ApiError(400, `Cannot apply for this job. Job status is: ${job.status}`);
  }

  // Check if job seeker has completed registration
  if (!jobSeeker.isRegistrationComplete) {
    throw new ApiError(400, "Please complete your registration before applying for jobs");
  }

  // Check if already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    jobSeeker: jobSeeker._id,
  });

  if (existingApplication) {
    if (existingApplication.status === "Withdrawn") {
      // Allow re-applying if previously withdrawn
      existingApplication.status = "Applied";
      // Update coverLetter and notes only if provided
      if (coverLetter !== undefined) {
        existingApplication.coverLetter = coverLetter?.trim() || "";
      }
      if (notes !== undefined) {
        existingApplication.notes = notes?.trim() || "";
      }
      await existingApplication.save();

      // Increment application count if it was withdrawn before
      await RecruiterJob.findByIdAndUpdate(jobId, {
        $inc: { applicationCount: 1 },
      });

      return res.status(200).json(
        ApiResponse.success(
          { application: existingApplication },
          "Application submitted successfully"
        )
      );
    } else {
      throw new ApiError(400, "You have already applied for this job");
    }
  }

  // Create new application
  // coverLetter and notes are optional - use empty string if not provided
  const application = await Application.create({
    job: jobId,
    jobSeeker: jobSeeker._id,
    coverLetter: coverLetter?.trim() || "",
    notes: notes?.trim() || "",
    status: "Applied",
  });

  // Increment application count on job
  await RecruiterJob.findByIdAndUpdate(jobId, {
    $inc: { applicationCount: 1 },
  });

  // Populate job and job seeker details for response
  await application.populate([
    {
      path: "job",
      select: "jobTitle city expectedSalary jobType employmentMode status",
    },
    {
      path: "jobSeeker",
      select: "firstName lastName phone email",
    },
  ]);

  return res.status(201).json(
    ApiResponse.success(
      { application },
      "Application submitted successfully"
    )
  );
});

/**
 * Get Job Seeker's Applications
 * Returns all applications made by the authenticated job seeker
 */
export const getMyApplications = asyncHandler(async (req, res) => {
  const jobSeeker = req.jobSeeker; // From auth middleware
  const { status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = { jobSeeker: jobSeeker._id };
  if (status) {
    filter.status = status;
  }

  // Pagination
  const pageNumber = Math.max(1, parseInt(page));
  const limitNumber = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNumber - 1) * limitNumber;

  // Fetch applications with pagination
  const applications = await Application.find(filter)
    .populate({
      path: "job",
      select: "jobTitle jobDescription city expectedSalary jobType employmentMode categories tags status applicationCount companySnapshot recruiter",
      populate: {
        path: "recruiter",
        select: "companyName companyLogo city state",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  // Get total count
  const totalApplications = await Application.countDocuments(filter);
  const totalPages = Math.ceil(totalApplications / limitNumber);

  return res.status(200).json(
    ApiResponse.success(
      {
        applications,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalApplications,
          limit: limitNumber,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
        },
      },
      "Applications fetched successfully"
    )
  );
});

/**
 * Withdraw Application
 * Allows job seeker to withdraw their application
 */
export const withdrawApplication = asyncHandler(async (req, res) => {
  const jobSeeker = req.jobSeeker;
  const { applicationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw new ApiError(400, "Invalid application ID format");
  }

  const application = await Application.findById(applicationId);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Check if application belongs to the job seeker
  if (application.jobSeeker.toString() !== jobSeeker._id.toString()) {
    throw new ApiError(403, "You are not authorized to withdraw this application");
  }

  // Check if already withdrawn
  if (application.status === "Withdrawn") {
    throw new ApiError(400, "Application is already withdrawn");
  }

  // Check if already processed (shortlisted/rejected)
  if (application.status === "Shortlisted" || application.status === "Rejected") {
    throw new ApiError(400, `Cannot withdraw application. Current status: ${application.status}`);
  }

  // Update status to withdrawn
  application.status = "Withdrawn";
  await application.save();

  // Decrement application count on job
  await RecruiterJob.findByIdAndUpdate(application.job, {
    $inc: { applicationCount: -1 },
  });

  return res.status(200).json(
    ApiResponse.success(
      { application },
      "Application withdrawn successfully"
    )
  );
});

