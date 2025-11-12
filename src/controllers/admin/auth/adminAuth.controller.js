import jwt from "jsonwebtoken";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { User } from "../../../models/users.model.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

  if (!accessTokenSecret) {
    throw new ApiError(500, "Access token secret is not configured");
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    accessTokenSecret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h",
    }
  );

  res
    .status(200)
    .json(
      ApiResponse.success(
        { token, user: safeUser },
        "Login successful"
      )
    );
});


