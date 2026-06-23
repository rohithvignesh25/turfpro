const jwt = require('jsonwebtoken');
const Credential = require('../models/Credential');
const TurfAdmin = require('../models/TurfAdmin');

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
      } else {
        return res.status(401).json({ message: 'Not authorized, invalid token type' });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const protectSuperAdmin = (req, res, next) => {
  if (req.user && req.userType === 'super_admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, strictly Super Admin only' });
  }
};

module.exports = { protect, protectSuperAdmin };
