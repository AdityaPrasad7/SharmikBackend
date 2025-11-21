import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Simple validation middleware for unified auth routes
 * Only validates the provided schema without processing extra fields like experienceStatus
 */
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

    // Validate with Joi schema (stripUnknown is true by default in schema.validate options)
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true, // Strip unknown fields
      convert: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      throw new ApiError(400, message);
    }

    // Assign validated and stripped data back to request
    if (property === "query") {
      req.query = value;
    } else if (property === "params") {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  });

