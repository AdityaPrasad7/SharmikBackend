import { Conversation } from "../models/chat/conversation.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to verify user access to a chat conversation.
 * It finds the conversation by `applicationId` from `req.params` or `req.body`.
 * It attaches the `conversation` and `userType` to the `req` object.
 *
 * This should be used on chat routes that require an existing conversation.
 */
export const verifyConversationAccess = asyncHandler(async (req, res, next) => {
  // applicationId can be in params (for GET) or body (for POST/PUT)
  const { applicationId } = req.params.applicationId
    ? req.params
    : req.body;

  if (!applicationId) {
    throw new ApiError(400, "Application ID is required");
  }

  // Determine user type and ID from auth middleware
  const userType = req.recruiter ? "recruiter" : "job-seeker";
  const userId = req.recruiter?._id || req.jobSeeker?._id;

  // Find the conversation
  const conversation = await Conversation.findOne({ application: applicationId });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user has access to this conversation
  const isRecruiterOwner =
    userType === "recruiter" &&
    conversation.recruiter.toString() === userId.toString();
  const isJobSeekerOwner =
    userType === "job-seeker" &&
    conversation.jobSeeker.toString() === userId.toString();

  if (!isRecruiterOwner && !isJobSeekerOwner) {
    throw new ApiError(403, "You are not authorized to access this conversation");
  }

  // Attach info to the request object for the next handler
  req.conversation = conversation;
  req.userType = userType;
  req.userId = userId;

  next();
});