import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * JobMeta Model
 * Stores job categories, job types, and facilities for recruiter job postings
 * This is a singleton collection (only one document)
 */
const jobMetaSchema = new Schema(
  {
    // Job Categories (e.g., Physical Work, Semi-Physical, Auto)
    jobCategories: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["Active", "Inactive"],
          default: "Active",
        },
      },
    ],

    // Job Types (e.g., Full Time, Part Time, Contract Based)
    jobTypes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["Active", "Inactive"],
          default: "Active",
        },
      },
    ],

    // Facilities (e.g., Food Provided, Accommodation Provided, Travel Facility)
    facilities: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
          unique: true,
        },
        label: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["Active", "Inactive"],
          default: "Active",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists (singleton pattern)
jobMetaSchema.index({ _id: 1 }, { unique: true });

export const JobMeta = model("JobMeta", jobMetaSchema);

