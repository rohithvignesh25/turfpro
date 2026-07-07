const jwt = require('jsonwebtoken');
const Credential = require('../models/Super_admin/Credential');
const TurfAdmin = require('../models/Super_admin/TurfAdmin');
const User = require('../models/User/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type === 'super_admin') {
        if (decoded.id === 'super_admin_id') {
          req.user = { _id: 'super_admin_id', username: 'turfpro@gmail.com' };
        } else {
          req.user = await Credential.findById(decoded.id).select('-password');
        }
        req.userType = 'super_admin';
      } else if (decoded.type === 'turf_admin') {
        req.user = await TurfAdmin.findById(decoded.id).select('-password');
        req.userType = 'turf_admin';
      } else if (decoded.type === 'user') {
        req.user = await User.findById(decoded.id).select('-password');
        req.userType = 'user';
      } else {
        return res.status(401).json({ status: false, message: 'Not authorized, invalid token type', data: null });
      }

      if (!req.user) {
        return res.status(401).json({ status: false, message: 'Not authorized, user not found', data: null });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ status: false, message: 'Not authorized, token failed', data: null });
    }
  }

  if (!token) {
    res.status(401).json({ status: false, message: 'Not authorized, no token', data: null });
  }
};

const protectSuperAdmin = (req, res, next) => {
  if (req.user && req.userType === 'super_admin') {
    next();
  } else {
    res.status(403).json({ status: false, message: 'Not authorized, strictly Super Admin only', data: null });
  }
};

const protectTurfAdmin = (req, res, next) => {
  if (req.user && req.userType === 'turf_admin') {
    next();
  } else {
    res.status(403).json({ status: false, message: 'Not authorized, strictly Turf Admin only', data: null });
  }
};

const protectUser = (req, res, next) => {
  if (req.user && req.userType === 'user') {
    next();
  } else {
    res.status(403).json({ status: false, message: 'Not authorized, strictly User only', data: null });
  }
};

module.exports = { protect, protectSuperAdmin, protectTurfAdmin, protectUser };
