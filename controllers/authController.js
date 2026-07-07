const Credential = require('../models/Super_admin/Credential');
const TurfAdmin = require('../models/Super_admin/TurfAdmin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Unified Login for Centralized Admin Panel
// @route   POST /api/auth/login
// @access  Public
const unifiedLogin = async (req, res) => {
  // Use email and password
  const email = req.body.email || req.body.username;
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: false, message: 'Please provide email and password', data: null });
  }

  try {
    // 1. Check if it's the Super Admin
    // Using the same credentials from Super_admin/authController
    if ((email === 'turfpro@gmail.com' && password === 'turfpro@turfpro') || (email === 'admin' && password === '123')) {
      const credential = await Credential.findOne({ username: email });
      const adminId = credential ? credential._id : 'super_admin_id';

      return res.json({
        status: true,
        message: 'Super Admin Login successful',
        data: {
          _id: adminId,
          email: email,
          role: 'super_admin',
          token: generateToken(adminId, 'super_admin'),
          permissions: ['dashboard', 'turf management', 'turf admin'] // explicit privileges list
        }
      });
    }

    // 2. Check if it's a Turf Admin
    const turfAdmin = await TurfAdmin.findOne({ email }).populate('turfId', 'name');
    if (turfAdmin && turfAdmin.isActive && (await bcrypt.compare(password, turfAdmin.password))) {
      return res.json({
        status: true,
        message: 'Turf Admin Login successful',
        data: {
          _id: turfAdmin._id,
          name: turfAdmin.name,
          email: turfAdmin.email,
          turfId: turfAdmin.turfId?._id || turfAdmin.turfId,
          turfName: turfAdmin.turfId?.name, // Send the turf name for the frontend dashboard
          role: 'turf_admin',
          token: generateToken(turfAdmin._id, 'turf_admin'),
          permissions: ['dashboard', 'manage turf', 'manage timeslot'] // explicit privileges list
        }
      });
    }

    // If neither matched
    return res.status(401).json({ status: false, message: 'Invalid email or password, or account deactivated', data: null });

  } catch (error) {
    console.error(`Unified Login error: ${error.message}`);
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

module.exports = {
  unifiedLogin
};
