import { JobMeta } from "../../models/recruiter/jobMeta.model.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Get Job Meta Data (Public endpoint)
 * Returns job categories, job types, and facilities for recruiter job posting form
 * This endpoint is used to populate dropdowns and toggles in the "Post New Job" screen
 */
export const getJobMeta = asyncHandler(async (req, res) => {
  // Get the job meta document (singleton)
  const jobMeta = await JobMeta.findOne();

  if (!jobMeta) {
    throw new ApiError(404, "Job meta data not found. Please seed the database.");
  }

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

