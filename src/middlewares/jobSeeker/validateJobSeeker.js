import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const validateRequest = (schema, property = "body") =>
  asyncHandler(async (req, res, next) => {
    let data;
    if (property === "query") {
      data = req.query;
    } else if (property === "params") {
      data = req.params;
    } else {
      data = req.body;
    }
    
    // Normalize keys and values - remove leading/trailing whitespace from keys and values
    if ((property === "body" || property === "params") && data) {
      const normalized = {};
      for (const [key, value] of Object.entries(data)) {
        // Remove whitespace (spaces, tabs, newlines) from keys
        const normalizedKey = key.trim();
        // Trim string values
        const normalizedValue = typeof value === "string" ? value.trim() : value;
        normalized[normalizedKey] = normalizedValue;
      }
      data = normalized;
      if (property === "body") {
        req.body = normalized;
      } else if (property === "params") {
        req.params = normalized;
      }
    }

    // Parse JSON strings from form-data before validation
    if (property === "body" && data) {
      // Parse selectedSkills if it's a JSON string or handle array format
      if (data.selectedSkills !== undefined && data.selectedSkills !== null) {
        // If it's already an array, keep it as is
        if (Array.isArray(data.selectedSkills)) {
          // Ensure all items are strings and trim them
          data.selectedSkills = data.selectedSkills.map(skill => 
            typeof skill === 'string' ? skill.trim() : String(skill).trim()
          ).filter(skill => skill.length > 0);
        } else if (typeof data.selectedSkills === "string") {
          // Try to parse as JSON array
          try {
            const parsed = JSON.parse(data.selectedSkills);
            if (Array.isArray(parsed)) {
              data.selectedSkills = parsed.map(skill => 
                typeof skill === 'string' ? skill.trim() : String(skill).trim()
              ).filter(skill => skill.length > 0);
            } else {
              throw new ApiError(400, "Invalid selectedSkills format. Must be a valid JSON array.");
            }
          } catch (error) {
            // If JSON parsing fails, check if it's a comma-separated string
            if (error instanceof SyntaxError) {
              const trimmed = data.selectedSkills.trim();
              // Check if it looks like a comma-separated list
              if (trimmed.includes(',')) {
                data.selectedSkills = trimmed.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
              } else {
                // Single value, convert to array
                data.selectedSkills = trimmed.length > 0 ? [trimmed] : [];
              }
            } else {
              throw new ApiError(400, "Invalid selectedSkills format. Must be a valid JSON array.");
            }
          }
        } else {
          // Not an array or string, convert to array
          data.selectedSkills = [String(data.selectedSkills).trim()].filter(skill => skill.length > 0);
        }
      }
      
      // Handle education - supports both new format (simple text) and old format (JSON object) for backward compatibility
      if (data.education && typeof data.education === "string") {
        // Try to parse as JSON (old format), if it fails, treat as plain text (new format)
        try {
          const parsed = JSON.parse(data.education);
          if (typeof parsed === "object" && parsed !== null && parsed.collegeInstituteName) {
            // Old format: extract collegeInstituteName
            data.education = parsed.collegeInstituteName;
          }
          // If parsing succeeds but doesn't have collegeInstituteName, keep as string (new format)
        } catch (error) {
          // Not JSON, treat as plain text (new format) - this is fine
        }
      }
      
      // Convert experienceStatus string to boolean (form-data sends everything as strings)
      // Supports both new format (boolean string) and old format (JSON object) for backward compatibility
      if (data.experienceStatus !== undefined && data.experienceStatus !== null) {
        if (typeof data.experienceStatus === "string") {
          const trimmed = data.experienceStatus.trim();
          const lowerValue = trimmed.toLowerCase();
          
          // New format: simple boolean string
          if (lowerValue === "true" || lowerValue === "1") {
            data.experienceStatus = true;
          } else if (lowerValue === "false" || lowerValue === "0") {
            data.experienceStatus = false;
          } else {
            // Old format: try to parse as JSON object and convert
            try {
              const parsed = JSON.parse(trimmed);
              if (typeof parsed === "object" && parsed !== null) {
                // Old format: {hasExperience: true, isFresher: false}
                data.experienceStatus = parsed.hasExperience === true && parsed.isFresher === false;
              } else {
                throw new ApiError(400, "Invalid experienceStatus format. Must be 'true', 'false', or a boolean JSON object.");
              }
            } catch (parseError) {
              throw new ApiError(400, "Invalid experienceStatus format. Must be 'true', 'false', or a valid JSON object.");
        }
          }
        } else if (typeof data.experienceStatus === "object" && data.experienceStatus !== null) {
          // Old format: already parsed object
          data.experienceStatus = data.experienceStatus.hasExperience === true && data.experienceStatus.isFresher === false;
        }
        // If it's already a boolean, keep it as is
      }
      
      // Parse questionAnswers if it's a JSON string
      if (data.questionAnswers && typeof data.questionAnswers === "string") {
        try {
          data.questionAnswers = JSON.parse(data.questionAnswers);
        } catch (error) {
          throw new ApiError(400, "Invalid questionAnswers format. Must be a valid JSON array.");
        }
      }
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      throw new ApiError(400, message);
    }

    if (property === "query") {
      req.query = value;
    } else if (property === "params") {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  });

