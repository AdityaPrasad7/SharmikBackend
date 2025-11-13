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
      
      // Parse experienceStatus if it's a JSON string
      if (data.experienceStatus && typeof data.experienceStatus === "string") {
        try {
          data.experienceStatus = JSON.parse(data.experienceStatus);
        } catch (error) {
          throw new ApiError(400, "Invalid experienceStatus format. Must be a valid JSON object.");
        }
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

