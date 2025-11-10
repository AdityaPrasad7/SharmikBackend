
import jwt from 'jsonwebtoken';
import  ApiError  from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AdminUser from '../modules/auth/admin/models/AdminUser.js';
import User from '../modules/auth/user/models/User.js';


export const verifyJWT = (allowedRoles = []) => {
      
  return asyncHandler(async (req, res, next) => {
    try {
      const token = req.cookies?.accessToken || req.headers['authorization']?.replace('Bearer ', '');
    
 
      if (!token) {
        throw new ApiError(401, 'Unauthorized request: No token provided');
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await AdminUser.findById(decodedToken._id).select('-password -refreshToken');

      if (!user) {
        throw new ApiError(401, 'Invalid access token: Admin user not found');
      }

      if (allowedRoles.length && !allowedRoles.includes(user.userType)) {
        throw new ApiError(403, 'Forbidden: Insufficient user type permissions');
      }

      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, error?.message || 'Invalid access token');
    }
  });
};
export const verifyJWTUser = asyncHandler(async (req, res, next) => {
  try {
    const token =  req.headers['authorization']?.replace('Bearer ', '');
    console.log('🚀 ~ verifyJWTUser ~ token:', token);

    if (!token) {
      throw new ApiError(401, 'Unauthorized request: No token provided');
    }


    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log("🚀 ~ decodedToken.userType :", decodedToken.userType )
    if (decodedToken.userType !== 'user') {
      throw new ApiError(403, 'Forbidden: Invalid user type');
    }

    const user = await User.findById(decodedToken._id).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(401, 'Invalid access token: User not found');
    }

    req.user = user;
    console.log('🚀 ~ verifyJWTUser ~ req.user:', req.user);
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});

export const verifyUserJWT = () => {
  return asyncHandler(async (req, res, next) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.headers["authorization"]?.replace("Bearer ", "");

      if (!token) throw new ApiError(401, "Unauthorized request: No token provided");

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded._id || decoded.id; // support both
      const user = await User.findById(userId).select("-password -refreshToken");


      if (!user) throw new ApiError(401, "User not found");

      req.user = user;
      next();
    } catch (err) {
      throw new ApiError(401, err.message || "Invalid token");
    }
  });
};