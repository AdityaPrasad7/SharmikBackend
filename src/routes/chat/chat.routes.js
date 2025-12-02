import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
  archiveConversation,
  getAllMessagesRecruiter,
  getAllMessagesJobSeeker,
} from "../../controllers/chat/chat.controller.js";
import { verifyRecruiterJWT } from "../../middlewares/recruiter/authRecruiter.js";
import { verifyJobSeekerJWT } from "../../middlewares/jobSeeker/authJobSeeker.js";
import {
  validateSendMessage,
  validateGetMessages,
  validateGetConversations,
  validateMarkAsRead,
  validateArchiveConversation,
} from "../../middlewares/chat/validateChat.js";

const router = express.Router();

// Recruiter Chat Routes
router.post(
  "/recruiters/send-message",
  verifyRecruiterJWT,
  validateSendMessage,
  sendMessage
);

router.get(
  "/recruiters/messages/:applicationId",
  verifyRecruiterJWT,
  validateGetMessages,
  getMessages
);

router.get(
  "/recruiters/conversations",
  verifyRecruiterJWT,
  validateGetConversations,
  getConversations
);

router.put(
  "/recruiters/mark-read",
  verifyRecruiterJWT,
  validateMarkAsRead,
  markAsRead
);

router.put(
  "/recruiters/archive",
  verifyRecruiterJWT,
  validateArchiveConversation,
  archiveConversation
);

// Job Seeker Chat Routes
router.post(
  "/job-seekers/send-message",
  verifyJobSeekerJWT,
  validateSendMessage,
  sendMessage
);

router.get(
  "/job-seekers/messages/:applicationId",
  verifyJobSeekerJWT,
  validateGetMessages,
  getMessages
);

router.get(
  "/job-seekers/conversations",
  verifyJobSeekerJWT,
  validateGetConversations,
  getConversations
);
router.get(
  "/recruiters/all-messages",
  verifyRecruiterJWT,
  getAllMessagesRecruiter
);
router.get(
  "/job-seekers/all-messages",
  verifyJobSeekerJWT,
  getAllMessagesJobSeeker
);


router.put(
  "/job-seekers/mark-read",
  verifyJobSeekerJWT,
  validateMarkAsRead,
  markAsRead
);

router.put(
  "/job-seekers/archive",
  verifyJobSeekerJWT,
  validateArchiveConversation,
  archiveConversation
);

export default router;



