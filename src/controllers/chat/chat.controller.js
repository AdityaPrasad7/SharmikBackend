import { Conversation } from "../../models/chat/conversation.model.js";
import { Message } from "../../models/chat/message.model.js";
import { Application } from "../../models/jobSeeker/application.model.js";
import { RecruiterJob } from "../../models/recruiter/jobPost/jobPost.model.js";
import { JobSeeker } from "../../models/jobSeeker/jobSeeker.model.js";
import { Recruiter } from "../../models/recruiter/recruiter.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose from "mongoose";
import { io, onlineUsers } from "../../../server.js";

/**
 * Send Message
 * Allows recruiter or job seeker to send a message in a conversation
 * 
 * @route POST /api/recruiters/chat/send-message
 * @route POST /api/job-seekers/chat/send-message
 * @requires Authentication
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { applicationId, content, messageType = "text" } = req.body;
  // Determine user type based on which auth middleware was used
  const userType = req.recruiter ? "recruiter" : "job-seeker";
  const userId = req.recruiter?._id || req.jobSeeker?._id;

  // Validate application exists
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Get job details
  const job = await RecruiterJob.findById(application.job);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // Verify user has access to this application
  if (userType === "recruiter") {
    if (job.recruiter.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to chat for this application");
    }
  } else if (userType === "job-seeker") {
    if (application.jobSeeker.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to chat for this application");
    }
  }

  // Find or create conversation
  let conversation = await Conversation.findOne({ application: applicationId });

  if (!conversation) {
    // Create new conversation
    // Only recruiter can initiate conversation
    if (userType !== "recruiter") {
      throw new ApiError(403, "Only recruiter can initiate a conversation");
    }

    conversation = await Conversation.create({
      application: applicationId,
      job: application.job,
      recruiter: job.recruiter,
      jobSeeker: application.jobSeeker,
      initiatedBy: userType === "recruiter" ? "recruiter" : "job-seeker",
      status: "active",
    });
  } else {
    // Verify conversation belongs to user
    if (userType === "recruiter" && conversation.recruiter.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to access this conversation");
    }
    if (userType === "job-seeker" && conversation.jobSeeker.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to access this conversation");
    }

    // Check if conversation is archived
    if (conversation.status === "archived") {
      conversation.status = "active";
      await conversation.save();
    }
  }

  // Create message
  const message = await Message.create({
    conversation: conversation._id,
    sender: userType,
    senderId: userId,
    content: content.trim(),
    messageType,
    isRead: false,
  });

  // Update conversation last message info
  conversation.lastMessage = content.trim().substring(0, 100); // Store first 100 chars
  conversation.lastMessageAt = new Date();
  conversation.lastMessageBy = userType;

  // Update unread counts
  if (userType === "recruiter") {
    conversation.unreadCountJobSeeker += 1;
    conversation.unreadCountRecruiter = 0; // Sender's unread count is 0
  } else {
    conversation.unreadCountRecruiter += 1;
    conversation.unreadCountJobSeeker = 0; // Sender's unread count is 0
  }

  await conversation.save();

  // Populate message with sender info
  await message.populate({
    path: "senderId",
    select: userType === "recruiter" ? "companyName companyLogo" : "name profilePhoto",
  });

  // Format response
  const formattedMessage = {
    _id: message._id,
    conversation: message.conversation,
    sender: message.sender,
    senderId: message.senderId,
    content: message.content,
    messageType: message.messageType,
    isRead: message.isRead,
    attachments: message.attachments || [],
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };

  return res.status(201).json(
    ApiResponse.success(
      { message: formattedMessage },
      "Message sent successfully"
    )
  );
  // Detect receiver (opposite user)
const receiverId =
  userType === "recruiter"
    ? application.jobSeeker.toString()
    : job.recruiter.toString();

// Check if receiver is online
const receiverSocket = onlineUsers.get(receiverId);

if (receiverSocket) {
  io.to(receiverSocket).emit("newMessage", formattedMessage);
  console.log("📨 Real-time message sent to:", receiverId);
} else {
  console.log("⚠ Receiver offline:", receiverId);
}

});

/**
 * Get Messages
 * Get all messages for a specific conversation
 * 
 * @route GET /api/recruiters/chat/messages/:applicationId
 * @route GET /api/job-seekers/chat/messages/:applicationId
 * @requires Authentication
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  // Determine user type based on which auth middleware was used
  const userType = req.recruiter ? "recruiter" : "job-seeker";
  const userId = req.recruiter?._id || req.jobSeeker?._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Validate application exists
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Find conversation
  const conversation = await Conversation.findOne({ application: applicationId });

  if (!conversation) {
    // Return empty messages if conversation doesn't exist
    return res.status(200).json(
      ApiResponse.success(
        {
          messages: [],
          conversation: null,
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalMessages: 0,
            limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        "No conversation found"
      )
    );
  }

  // Verify user has access
  if (userType === "recruiter" && conversation.recruiter.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this conversation");
  }
  if (userType === "job-seeker" && conversation.jobSeeker.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this conversation");
  }

  // Mark messages as read for current user
  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: userType },
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  // Update unread count
  if (userType === "recruiter") {
    conversation.unreadCountRecruiter = 0;
  } else {
    conversation.unreadCountJobSeeker = 0;
  }
  await conversation.save();

  // Fetch messages
  const messages = await Message.find({
    conversation: conversation._id,
    isDeleted: false,
  })
    .populate({
      path: "senderId",
      select: userType === "recruiter" ? "companyName companyLogo" : "name profilePhoto",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Reverse to show oldest first
  messages.reverse();

  // Get total count
  const totalMessages = await Message.countDocuments({
    conversation: conversation._id,
    isDeleted: false,
  });
  const totalPages = Math.ceil(totalMessages / limit);

  // Format messages
  const formattedMessages = messages.map((msg) => ({
    _id: msg._id,
    conversation: msg.conversation,
    sender: msg.sender,
    senderId: msg.senderId,
    content: msg.content,
    messageType: msg.messageType,
    isRead: msg.isRead,
    attachments: msg.attachments || [],
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  }));

  // Populate conversation details
  await conversation.populate([
    {
      path: "job",
      select: "jobTitle jobDescription",
    },
    {
      path: "recruiter",
      select: "companyName companyLogo",
    },
    {
      path: "jobSeeker",
      select: "name profilePhoto",
    },
  ]);

  return res.status(200).json(
    ApiResponse.success(
      {
        messages: formattedMessages,
        conversation: {
          _id: conversation._id,
          application: conversation.application,
          job: conversation.job,
          recruiter: conversation.recruiter,
          jobSeeker: conversation.jobSeeker,
          initiatedBy: conversation.initiatedBy,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageBy: conversation.lastMessageBy,
          unreadCountRecruiter: conversation.unreadCountRecruiter,
          unreadCountJobSeeker: conversation.unreadCountJobSeeker,
          status: conversation.status,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      "Messages fetched successfully"
    )
  );
});

/**
 * Get Conversations
 * Get all conversations for the authenticated user
 * 
 * @route GET /api/recruiters/chat/conversations
 * @route GET /api/job-seekers/chat/conversations
 * @requires Authentication
 */
export const getConversations = asyncHandler(async (req, res) => {
  // Determine user type based on which auth middleware was used
  const userType = req.recruiter ? "recruiter" : "job-seeker";
  const userId = req.recruiter?._id || req.jobSeeker?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status || "active";
  const skip = (page - 1) * limit;

  // Build query based on user type
  const query = {
    status,
  };

  if (userType === "recruiter") {
    query.recruiter = userId;
  } else {
    query.jobSeeker = userId;
  }

  // Fetch conversations
  const conversations = await Conversation.find(query)
    .populate([
      {
        path: "application",
        select: "status coverLetter",
      },
      {
        path: "job",
        select: "jobTitle jobDescription city expectedSalary",
      },
      {
        path: "recruiter",
        select: "companyName companyLogo",
      },
      {
        path: "jobSeeker",
        select: "name profilePhoto",
      },
    ])
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count
  const totalConversations = await Conversation.countDocuments(query);
  const totalPages = Math.ceil(totalConversations / limit);

  // Format conversations
  const formattedConversations = conversations.map((conv) => ({
    _id: conv._id,
    application: conv.application,
    job: conv.job,
    recruiter: conv.recruiter,
    jobSeeker: conv.jobSeeker,
    initiatedBy: conv.initiatedBy,
    lastMessage: conv.lastMessage,
    lastMessageAt: conv.lastMessageAt,
    lastMessageBy: conv.lastMessageBy,
    unreadCount: userType === "recruiter" ? conv.unreadCountRecruiter : conv.unreadCountJobSeeker,
    status: conv.status,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  }));

  return res.status(200).json(
    ApiResponse.success(
      {
        conversations: formattedConversations,
        pagination: {
          currentPage: page,
          totalPages,
          totalConversations,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      "Conversations fetched successfully"
    )
  );
});

/**
 * Mark Messages as Read
 * Mark all unread messages in a conversation as read
 * 
 * @route PUT /api/recruiters/chat/mark-read
 * @route PUT /api/job-seekers/chat/mark-read
 * @requires Authentication
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  // Determine user type based on which auth middleware was used
  const userType = req.recruiter ? "recruiter" : "job-seeker";
  const userId = req.recruiter?._id || req.jobSeeker?._id;

  // Find conversation
  const conversation = await Conversation.findOne({ application: applicationId });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user has access
  if (userType === "recruiter" && conversation.recruiter.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this conversation");
  }
  if (userType === "job-seeker" && conversation.jobSeeker.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this conversation");
  }

  // Mark messages as read
  const result = await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: userType },
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  // Update unread count
  if (userType === "recruiter") {
    conversation.unreadCountRecruiter = 0;
  } else {
    conversation.unreadCountJobSeeker = 0;
  }
  await conversation.save();

  return res.status(200).json(
    ApiResponse.success(
      {
        markedCount: result.modifiedCount,
      },
      "Messages marked as read successfully"
    )
  );
});

/**
 * Archive Conversation
 * Archive a conversation (soft delete)
 * 
 * @route PUT /api/recruiters/chat/archive
 * @route PUT /api/job-seekers/chat/archive
 * @requires Authentication
 */
export const archiveConversation = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  // Determine user type based on which auth middleware was used
  const userType = req.recruiter ? "recruiter" : "job-seeker";
  const userId = req.recruiter?._id || req.jobSeeker?._id;

  // Find conversation
  const conversation = await Conversation.findOne({ application: applicationId });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user has access
  if (userType === "recruiter" && conversation.recruiter.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this conversation");
  }
  if (userType === "job-seeker" && conversation.jobSeeker.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this conversation");
  }

  // Archive conversation
  conversation.status = "archived";
  await conversation.save();

  return res.status(200).json(
    ApiResponse.success(
      { conversation },
      "Conversation archived successfully"
    )
  );
});

export const getAllMessagesRecruiter = asyncHandler(async (req, res) => {
  const recruiterId = req.recruiter._id;

  // 1. Find all conversations for this recruiter
  const conversations = await Conversation.find({ recruiter: recruiterId })
    .populate("job", "jobTitle")
    .populate("jobSeeker", "name profilePhoto")
    .lean();

  if (!conversations.length) {
    return res.status(200).json(
      ApiResponse.success(
        { total: 0, conversations: [] },
        "No conversations found"
      )
    );
  }

  // 2. For each conversation get messages
  const results = [];

  for (const conv of conversations) {
    const messages = await Message.find({
      conversation: conv._id,
      isDeleted: false,
    })
      .populate({
        path: "senderId",
        select: "name companyName profilePhoto companyLogo",
      })
      .sort({ createdAt: 1 })
      .lean();

    results.push({
      conversationId: conv._id,
      applicationId: conv.application,
      jobTitle: conv.job?.jobTitle,
      jobSeeker: conv.jobSeeker,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      messages,
    });
  }

  return res.status(200).json(
    ApiResponse.success(
      {
        total: results.length,
        conversations: results,
      },
      "All recruiter messages fetched successfully"
    )
  );
});


export const getAllMessagesJobSeeker = asyncHandler(async (req, res) => {
  const jobSeekerId = req.jobSeeker._id;

  const conversations = await Conversation.find({ jobSeeker: jobSeekerId })
    .populate("job", "jobTitle")
    .populate("recruiter", "companyName companyLogo")
    .lean();

  if (!conversations.length) {
    return res.status(200).json(
      ApiResponse.success(
        { total: 0, conversations: [] },
        "No conversations found"
      )
    );
  }

  const results = [];

  for (const conv of conversations) {
    const messages = await Message.find({
      conversation: conv._id,
      isDeleted: false,
    })
      .populate({
        path: "senderId",
        select: "name profilePhoto companyName companyLogo",
      })
      .sort({ createdAt: 1 })
      .lean();

    results.push({
      conversationId: conv._id,
      applicationId: conv.application,
      jobTitle: conv.job?.jobTitle,
      recruiter: conv.recruiter,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      messages,
    });
  }

  return res.status(200).json(
    ApiResponse.success(
      {
        total: results.length,
        conversations: results,
      },
      "All job seeker messages fetched successfully"
    )
  );
});
