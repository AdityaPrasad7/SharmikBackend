import mongoose from "mongoose";

const { Schema, model } = mongoose;

const stateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

stateSchema.index({ name: 1 }, { unique: true });
stateSchema.index({ code: 1 }, { unique: true });
stateSchema.index({ status: 1 });

export const State = model("State", stateSchema);

