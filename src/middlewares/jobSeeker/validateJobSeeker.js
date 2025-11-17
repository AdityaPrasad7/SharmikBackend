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
      // Parse selectedSkills if it's a JSON string
      if (data.selectedSkills && typeof data.selectedSkills === "string") {
        try {
          data.selectedSkills = JSON.parse(data.selectedSkills);
        } catch (error) {
          throw new ApiError(400, "Invalid selectedSkills format. Must be a valid JSON array.");
        }
      }
      
      // Parse education if it's a JSON string
      if (data.education && typeof data.education === "string") {
        try {
          data.education = JSON.parse(data.education);
        } catch (error) {
          throw new ApiError(400, "Invalid education format. Must be a valid JSON object.");
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

