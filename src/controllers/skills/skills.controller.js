import { Specialization } from "../../models/admin/specialization/specialization.model.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Get All Skills (Public endpoint)
 * Returns all unique skills from all specializations
 * Used to get a complete list of all available skills regardless of specialization
 * 
 * Query Parameters:
 * - search: Optional search term to filter and prioritize matching skills
 */
export const getAllSkills = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const specializations = await Specialization.find({ status: "Active" })
    .select("skills")
    .lean();

  // Collect all skills from all specializations
  const allSkills = [];
  specializations.forEach((spec) => {
    if (spec.skills && Array.isArray(spec.skills)) {
      allSkills.push(...spec.skills);
    }
  });

  // Remove duplicates and trim
  const uniqueSkills = [...new Set(allSkills)]
    .filter((skill) => skill && skill.trim()) // Remove empty strings
    .map((skill) => skill.trim()); // Trim whitespace

  // Format for frontend compatibility
  let formattedSkills = uniqueSkills.map((skill) => ({
    value: skill,
    label: skill,
  }));

  // If search term is provided, filter and prioritize matching skills
  // Case-insensitive search, ignores spaces in both search term and skill names
  if (search && String(search).length > 0) {
    // Normalize search term: remove ALL whitespace, convert to lowercase
    const searchTerm = String(search).replace(/\s+/g, '').toLowerCase();
    
    // Separate skills into matching and non-matching
    const matchingSkills = [];
    const nonMatchingSkills = [];

    formattedSkills.forEach((skill) => {
      // Normalize skill name: remove ALL whitespace, convert to lowercase for comparison
      const skillNormalized = skill.value.replace(/\s+/g, '').toLowerCase();
      
      // Case-insensitive search - check if normalized skill (without spaces) contains normalized search term (without spaces)
      if (skillNormalized.includes(searchTerm)) {
        matchingSkills.push(skill);
      } else {
        nonMatchingSkills.push(skill);
      }
    });

    // Sort matching skills by relevance (exact match first, then starts with, then contains)
    matchingSkills.sort((a, b) => {
      // Normalize for comparison: remove ALL spaces, convert to lowercase
      const aNormalized = a.value.replace(/\s+/g, '').toLowerCase();
      const bNormalized = b.value.replace(/\s+/g, '').toLowerCase();
      
      // Exact match gets highest priority (when spaces are removed)
      if (aNormalized === searchTerm && bNormalized !== searchTerm) return -1;
      if (bNormalized === searchTerm && aNormalized !== searchTerm) return 1;
      
      // Starts with search term gets second priority
      if (aNormalized.startsWith(searchTerm) && !bNormalized.startsWith(searchTerm)) return -1;
      if (bNormalized.startsWith(searchTerm) && !aNormalized.startsWith(searchTerm)) return 1;
      
      // Otherwise sort alphabetically (using original values for better readability)
      return a.value.toLowerCase().localeCompare(b.value.toLowerCase());
    });

    // Only return matching skills when search is provided
    formattedSkills = matchingSkills;
  } else {
    // No search term, just sort alphabetically
    formattedSkills.sort((a, b) => 
      a.value.toLowerCase().localeCompare(b.value.toLowerCase())
    );
  }

  return res
    .status(200)
    .json(
      ApiResponse.success(
        {
          skills: formattedSkills,
          totalSkills: formattedSkills.length,
          searchTerm: search || null,
        },
        search 
          ? `Found ${formattedSkills.length} skills matching "${search}"`
          : "All skills fetched successfully"
      )
    );
});

