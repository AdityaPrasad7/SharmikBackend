import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const { Schema, model } = mongoose;

// Base User Schema
const baseOptions = {
  discriminatorKey: "role", // identifies user type
  collection: "users",
  timestamps: true,
};

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "Admin",
        "Doctor",
        "Therapist",
        "Receptionist",
        "Nurse",
        "Pharmacist",
        "Patient",
      ],
      required: true,
    },
  },
  baseOptions
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Base model
export const User = model("User", userSchema);

/* ---------------------------------------------------
   Discriminators for each user role
--------------------------------------------------- */

// Admin
export const Admin = User.discriminator(
  "Admin",
  new Schema({})
);

// Doctor
export const Doctor = User.discriminator(
  "Doctor",
  new Schema({
    specialization: String,
  })
);

// Therapist
export const Therapist = User.discriminator(
  "Therapist",
  new Schema({
    expertise: String,
  })
);

// Receptionist
export const Receptionist = User.discriminator(
  "Receptionist",
  new Schema({})
);

// Nurse
export const Nurse = User.discriminator(
  "Nurse",
  new Schema({
    ward: String,
  })
);

// Pharmacist
export const Pharmacist = User.discriminator(
  "Pharmacist",
  new Schema({})
);

// Patient
export const Patient = User.discriminator(
  "Patient",
  new Schema({
    uhid: { type: String, unique: true },
  })
);
