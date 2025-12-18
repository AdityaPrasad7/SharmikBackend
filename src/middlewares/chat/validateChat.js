import Joi from "joi";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  sendMessageSchema,
  getMessagesSchema,
  getConversationsSchema,
  markAsReadSchema,
  archiveConversationSchema,
} from "../../validation/chat/chat.validation.js";

/**
 * Validate send message request
 */
export const validateSendMessage = asyncHandler(async (req, res, next) => {
  const { error, value } = sendMessageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(", ");
    throw new ApiError(400, errorMessages);
  }

  req.body = value;
  next();
});

/**
 * Validate get messages request
 */
export const validateGetMessages = asyncHandler(async (req, res, next) => {
  const { error, value } = getMessagesSchema.validate(
    {
      applicationId: req.params.applicationId,
      page: req.query.page,
      limit: req.query.limit,
    },
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(", ");
    throw new ApiError(400, errorMessages);
  }

  req.params.applicationId = value.applicationId;
  req.query.page = value.page;
  req.query.limit = value.limit;
  next();
});

/**
 * Validate get conversations request
 */
export const validateGetConversations = asyncHandler(async (req, res, next) => {
  const { error, value } = getConversationsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(", ");
    throw new ApiError(400, errorMessages);
  }

  req.query = value;
  next();
});

/**
 * Validate mark as read request
 */
export const validateMarkAsRead = asyncHandler(async (req, res, next) => {
  const { error, value } = markAsReadSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(", ");
    throw new ApiError(400, errorMessages);
  }

  req.body = value;
  next();
});

/**
 * Validate archive conversation request
 */
export const validateArchiveConversation = asyncHandler(async (req, res, next) => {
  const { error, value } = archiveConversationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(", ");
    throw new ApiError(400, errorMessages);
  }

  req.body = value;
  next();
});















