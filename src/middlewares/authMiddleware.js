import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.model.js";

const extractToken = (req) => {
  const headerToken = req.headers["authorization"]?.replace("Bearer ", "");
  const cookieToken = req.cookies?.accessToken;

  return headerToken || cookieToken || null;
};

export const verifyJWT = (allowedRoles = []) =>
  asyncHandler(async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    if (!accessTokenSecret) {
      throw new ApiError(500, "Access token secret is not configured");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, accessTokenSecret);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired token");
    }

    const userId = decodedToken.id || decodedToken._id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      throw new ApiError(403, "Forbidden: Insufficient permissions");
    }

    req.user = user;
    req.accessToken = token;
    next();
  });

export const verifyUserJWT = () =>
  verifyJWT(["Patient", "Doctor", "Therapist", "Receptionist", "Nurse", "Pharmacist", "Admin"]);
