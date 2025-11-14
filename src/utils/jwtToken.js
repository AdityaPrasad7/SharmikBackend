import jwt from "jsonwebtoken";

/**
 * Generate Access Token for Job Seeker
 * Access tokens are valid for 24 hours
 * Used for authenticating API requests
 * 
 * @param {Object} payload - Token payload (id, phone, role)
 * @returns {string} - JWT access token
 */
export const generateAccessToken = (payload) => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  
  if (!accessTokenSecret) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: payload.id,
      phone: payload.phone,
      role: payload.role || "job-seeker",
      type: "access", // Token type identifier
    },
    accessTokenSecret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "24h", // Default: 24 hours
    }
  );
};

/**
 * Generate Refresh Token for Job Seeker
 * Refresh tokens are long-lived (7-30 days)
 * Used to get new access tokens when they expire
 * 
 * @param {Object} payload - Token payload (id, phone)
 * @returns {string} - JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  
  if (!refreshTokenSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: payload.id,
      phone: payload.phone,
      type: "refresh", // Token type identifier
    },
    refreshTokenSecret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d", // Default: 7 days
    }
  );
};

/**
 * Verify Access Token
 * 
 * @param {string} token - JWT access token
 * @returns {Object} - Decoded token payload
 */
export const verifyAccessToken = (token) => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  
  if (!accessTokenSecret) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured");
  }

  return jwt.verify(token, accessTokenSecret);
};

/**
 * Verify Refresh Token
 * 
 * @param {string} token - JWT refresh token
 * @returns {Object} - Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  
  if (!refreshTokenSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }

  return jwt.verify(token, refreshTokenSecret);
};

