import { Role } from "../../models/role/role.model.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Get Available Roles
 * Returns the available roles that users can select (Job Seeker or Recruiter)
 * Fetches from database (seeded roles)
 */
export const getAvailableRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find({ status: "Active" })
    .select("name value label description icon registrationPath status")
    .sort({ name: 1 })
    .lean();

  // Format for frontend compatibility
  const formattedRoles = roles.map((role) => ({
    id: role.value,
    value: role.value,
    label: role.label,
    name: role.name,
    description: role.description || "",
    icon: role.icon || "",
    registrationPath: role.registrationPath,
  }));

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { roles: formattedRoles },
        "Available roles fetched successfully"
      )
    );
});

