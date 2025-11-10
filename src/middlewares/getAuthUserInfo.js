import jwt from 'jsonwebtoken';
import AdminUser from '../modules/auth/admin/models/AdminUser.js';
import User from '../modules/auth/user/models/User.js';

export const getAuthUserInfo = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      let user;
      if (decoded.userType === 'admin' || decoded.userType === 'subadmin') {
        user = await AdminUser.findById(decoded._id).lean();
      } else {
        user = await User.findById(decoded._id).lean();
      }
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore error if token is invalid/expired, user will be unauthenticated
  }
  next();
};