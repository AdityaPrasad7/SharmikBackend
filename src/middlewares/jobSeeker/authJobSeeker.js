import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { JobSeeker } from "../../models/jobSeeker/jobSeeker.model.js";
import { verifyAccessToken } from "../../utils/jwtToken.js";

/**
 * Extract token from request
 * Checks both Authorization header and cookies
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} - Token or null
 */
const extractToken = (req) => {
  // Check Authorization header: "Bearer <token>"
  const headerToken = req.headers["authorization"]?.replace("Bearer ", "");
  
  // Check cookie (for web apps)
  const cookieToken = req.cookies?.accessToken;
  
  return headerToken || cookieToken || null;
};

/**
 * Verify Job Seeker JWT Middleware
 * 
 * This middleware:
 * 1. Extracts access token from request
 * 2. Verifies token signature and expiration
 * 3. Finds job seeker in database
 * 4. Attaches job seeker to request object
 * 
 * Usage:
 * router.get("/profile", verifyJobSeekerJWT, getProfile);
 */
export const verifyJobSeekerJWT = asyncHandler(async (req, res, next) => {
  // 1. Extract token from request
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(401, "Unauthorized: No access token provided");
  }

  // 2. Verify token signature and expiration
  let decodedToken;
  try {
    decodedToken = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired. Please refresh your token.");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    } else {
      throw new ApiError(401, "Token verification failed");
    }
  }

  // 3. Verify token type (should be "access")
  if (decodedToken.type !== "access") {
    throw new ApiError(401, "Invalid token type. Expected access token.");
  }

  // 4. Find job seeker in database
  const jobSeeker = await JobSeeker.findById(decodedToken.id).select("-refreshToken");

  if (!jobSeeker) {
    throw new ApiError(401, "Invalid access token: Job seeker not found");
  }

  // 5. Check if job seeker is active
  if (jobSeeker.status === "Inactive" || jobSeeker.status === "Rejected") {
    throw new ApiError(403, "Account is inactive. Please contact support.");
  }

  // 6. Attach job seeker to request object
  req.jobSeeker = jobSeeker;
  req.jobSeekerId = jobSeeker._id;
  req.accessToken = token;

  // 7. Continue to next middleware/controller
  next();
});

