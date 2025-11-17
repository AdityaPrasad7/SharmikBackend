import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recruiterSchema = new Schema(
  {
    // Basic Information
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    companyName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Location
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },

    // Documents
    profilePhoto: {
      type: String, // Backward compatibility
    },
    companyLogo: {
      type: String,
    },
    documents: [
      {
        type: String, // Array of file paths or URLs
      },
    ],

    // Registration Status
    registrationStep: {
      type: Number,
      default: 0,
    },
    isRegistrationComplete: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive", "Rejected"],
      default: "Pending",
    },

    // Role (for auth tokens)
    role: {
      type: String,
      default: "recruiter",
      enum: ["recruiter"],
    },

    // Authentication
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
recruiterSchema.index({ phone: 1 });
recruiterSchema.index({ status: 1 });

export const Recruiter = model("Recruiter", recruiterSchema);

