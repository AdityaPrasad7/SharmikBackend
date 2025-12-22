import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const COIN_PRICING_CATEGORIES = ["jobSeeker", "recruiter"];

const coinPackageSchema = new Schema(
  {
    category: {
      type: String,
      enum: COIN_PRICING_CATEGORIES,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    coins: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "INR" },
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

coinPackageSchema.index({ category: 1, name: 1 }, { unique: true });

export const CoinPackage = model("CoinPackage", coinPackageSchema);

const coinRuleSchema = new Schema(
  {
    category: {
      type: String,
      enum: COIN_PRICING_CATEGORIES,
      required: true,
      unique: true,
    },
    // Custom amount pricing: for ₹baseAmount, user gets baseCoins
    // e.g., baseAmount=100, baseCoins=150 means ₹100 = 150 coins
    baseAmount: {
      type: Number,
      default: 100,
      min: 1,
    },
    baseCoins: {
      type: Number,
      default: 100,
      min: 1,
    },
    // For job seekers
    coinCostPerApplication: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinPerEmployeeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // For recruiters
    coinCostPerJobPost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const CoinRule = model("CoinRule", coinRuleSchema);
