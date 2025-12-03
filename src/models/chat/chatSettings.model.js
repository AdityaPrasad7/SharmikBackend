import mongoose from "mongoose";

const chatSettingsSchema = new mongoose.Schema(
  {
    defaultRecruiterMessage: {
      type: String,
      required: true,
      default: "Hello! Thank you for applying. We will review your application shortly."
    },
  },
  { timestamps: true }
);

export const ChatSettings = mongoose.model("ChatSettings", chatSettingsSchema);
