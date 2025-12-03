import { Conversation } from "../../models/chat/conversation.model.js";
import { Message } from "../../models/chat/message.model.js";
import { ChatSettings } from "../../models/chat/chatSettings.model.js";

export const autoStartConversation = async (application, job) => {
  // 1. Create conversation only one time
  let conversation = await Conversation.findOne({ application: application._id });

  if (!conversation) {
    conversation = await Conversation.create({
      application: application._id,
      job: job._id,
      recruiter: job.recruiter,
      jobSeeker: application.jobSeeker,
      initiatedBy: "recruiter",
      status: "active"
    });

    // 2. Get default message
    const settings = await ChatSettings.findOne();
    const defaultMsg = settings?.defaultRecruiterMessage || 
      "Hello! Thank you for applying. We'll reach you soon.";

    // 3. Send first message
    await Message.create({
      conversation: conversation._id,
      sender: "recruiter",
      senderId: job.recruiter,
      content: defaultMsg,
      messageType: "text",
      isRead: false
    });

    conversation.lastMessage = defaultMsg;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageBy = "recruiter";
    await conversation.save();
  }

  return conversation;
};
