import mongoose from "mongoose";

const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: ["recruiter", "job-seeker"],
      required: true,
    },

    senderModel: {
      type: String,
      required: true,
      enum: ["Recruiter", "JobSeeker"],
    },

    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel",
    },


    // OPTIONAL (text not required for file uploads)
    content: {
      type: String,
      trim: true,
      default: "",
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },

    messageType: {
      type: String,
      enum: ["text", "file", "image"],
      default: "text",
    },

    attachments: [
      {
        url: String,
        publicId: String,
        fileType: String,
        fileSize: Number,
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);


// Indexes for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, conversation: 1 });

export const Message = model("Message", messageSchema);















