import Joi from "joi";

// Send Message Schema
export const sendMessageSchema = Joi.object({
  applicationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid application ID format",
      "any.required": "Application ID is required",
    }),
  content: Joi.string().trim().min(1).max(5000).required().messages({
    "string.min": "Message content cannot be empty",
    "string.max": "Message content must not exceed 5000 characters",
    "any.required": "Message content is required",
  }),
  messageType: Joi.string()
    .valid("text", "file", "image")
    .default("text")
    .optional()
    .messages({
      "any.only": "Message type must be one of: text, file, image",
    }),
});

// Get Messages Schema
export const getMessagesSchema = Joi.object({
  applicationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid application ID format",
      "any.required": "Application ID is required",
    }),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

// Get Conversations Schema (for listing all conversations)
export const getConversationsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(50).optional().default(20),
  status: Joi.string()
    .valid("active", "archived")
    .optional()
    .messages({
      "any.only": "Status must be one of: active, archived",
    }),
});

// Mark Messages as Read Schema
export const markAsReadSchema = Joi.object({
  applicationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid application ID format",
      "any.required": "Application ID is required",
    }),
});

// Archive Conversation Schema
export const archiveConversationSchema = Joi.object({
  applicationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid application ID format",
      "any.required": "Application ID is required",
    }),
});

