import jwt from "jsonwebtoken";
import { JobSeeker } from "../models/jobSeeker/jobSeeker.model.js";
import { Recruiter } from "../models/recruiter/recruiter.model.js";
import ApiError from "../utils/ApiError.js";

/**
 * Simple auth middleware for notification routes
 * Checks JWT token and finds user from JobSeeker or Recruiter collection
 */
export const verifyNotificationAuth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers["authorization"]?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "No token provided");
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.id || decoded._id;

        if (!userId) {
            throw new ApiError(401, "Invalid token");
        }

        // Try to find user in JobSeeker first
        let user = await JobSeeker.findById(userId);

        if (user) {
            req.user = {
                _id: user._id,
                role: "job-seeker",
            };
            return next();
        }

        // Try Recruiter
        user = await Recruiter.findById(userId);

        if (user) {
            req.user = {
                _id: user._id,
                role: "recruiter",
            };
            return next();
        }

        throw new ApiError(401, "User not found");
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
                data: null,
                meta: null,
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired",
                data: null,
                meta: null,
            });
        }
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Authentication failed",
            data: null,
            meta: null,
        });
    }
};
