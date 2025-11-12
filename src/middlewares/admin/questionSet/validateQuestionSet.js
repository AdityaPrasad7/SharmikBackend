import ApiError from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const validateRequest = (schema, property = "body") =>
  asyncHandler(async (req, res, next) => {
    const target = property === "query" ? req.query : req.body;

    const { error, value } = schema.validate(target, {
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
    } else {
      req.body = value;
    }

    next();
  });


