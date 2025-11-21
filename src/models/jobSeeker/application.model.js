import mongoose from "mongoose";

const { Schema, model } = mongoose;

const applicationSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "RecruiterJob",
      required: true,
      index: true,
    },
    jobSeeker: {
      type: Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Rejected", "Withdrawn"],
      default: "Applied",
      index: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, jobSeeker: 1 }, { unique: true });

export const Application = model("Application", applicationSchema);






