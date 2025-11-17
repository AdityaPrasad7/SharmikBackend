import { JobMeta } from "../../../models/recruiter/jobPost/jobMeta.model.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/ApiError.js";

/**
 * Helper function to get JobMeta document
 */
const getJobMetaDocument = async () => {
  const jobMeta = await JobMeta.findOne();
  if (!jobMeta) {
    throw new ApiError(404, "Job meta data not found. Please seed the database.");
  }
  return jobMeta;
};

/**
 * Get Job Categories (Public endpoint)
 * Returns job categories for selection buttons/chips
 * Used in "Job Type & Facilities" section - Job Category subsection
 */
export const getJobCategories = asyncHandler(async (req, res) => {
  const jobMeta = await getJobMetaDocument();

  // Format job categories (only active ones)
  const jobCategories = jobMeta.jobCategories
    .filter((category) => category.status === "Active")
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      _id: category._id,
      name: category.name,
      value: category.name,
      label: category.name,
      order: category.order,
    }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobCategories },
        "Job categories fetched successfully"
      )
    );
});

/**
 * Get Job Types (Public endpoint)
 * Returns job types for toggle buttons (single select)
 * Used in "Job Type" section
 */
export const getJobTypes = asyncHandler(async (req, res) => {
  const jobMeta = await getJobMetaDocument();

  // Format job types (only active ones)
  const jobTypes = jobMeta.jobTypes
    .filter((type) => type.status === "Active")
    .sort((a, b) => a.order - b.order)
    .map((type) => ({
      _id: type._id,
      name: type.name,
      value: type.name,
      label: type.name,
      order: type.order,
    }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobTypes },
        "Job types fetched successfully"
      )
    );
});

/**
 * Get Facilities (Public endpoint)
 * Returns facilities for toggle switches (multiple select)
 * Used in "Job Type & Facilities" section - Facilities subsection
 */
export const getFacilities = asyncHandler(async (req, res) => {
  const jobMeta = await getJobMetaDocument();

  // Format facilities (only active ones)
  const facilities = jobMeta.facilities
    .filter((facility) => facility.status === "Active")
    .sort((a, b) => a.order - b.order)
    .map((facility) => ({
      _id: facility._id,
      key: facility.key,
      label: facility.label,
      value: facility.key,
      order: facility.order,
    }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { facilities },
        "Facilities fetched successfully"
      )
    );
});

/**
 * Get Job Meta Data (Public endpoint) - Combined endpoint
 * Returns job categories, job types, and facilities in one call
 * This endpoint is optional - can be used if frontend wants all data at once
 */
export const getJobMeta = asyncHandler(async (req, res) => {
  const jobMeta = await getJobMetaDocument();

  // Format job categories (only active ones)
  const jobCategories = jobMeta.jobCategories
    .filter((category) => category.status === "Active")
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      _id: category._id,
      name: category.name,
      value: category.name,
      label: category.name,
      order: category.order,
    }));

  // Format job types (only active ones)
  const jobTypes = jobMeta.jobTypes
    .filter((type) => type.status === "Active")
    .sort((a, b) => a.order - b.order)
    .map((type) => ({
      _id: type._id,
      name: type.name,
      value: type.name,
      label: type.name,
      order: type.order,
    }));

  // Format facilities (only active ones)
  const facilities = jobMeta.facilities
    .filter((facility) => facility.status === "Active")
    .sort((a, b) => a.order - b.order)
    .map((facility) => ({
      _id: facility._id,
      key: facility.key,
      label: facility.label,
      value: facility.key,
      order: facility.order,
    }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        {
          jobCategories,
          jobTypes,
          facilities,
        },
        "Job meta data fetched successfully"
      )
    );
});

