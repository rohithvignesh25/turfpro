const Credential = require('../models/Credential');
const TurfAdmin = require('../models/TurfAdmin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Auth super admin & get token
// @route   POST /api/admin/login
// @access  Public
const authAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hardcoded super admin login logic
    if (username === 'turfpro@gmail.com' && password === 'turfpro@turfpro') {
      // Try to find the credential in the DB to get a valid _id, otherwise use a fallback
      const credential = await Credential.findOne({ username });
      const adminId = credential ? credential._id : 'super_admin_id';
      
      res.json({
        status: true,
        message: 'Login successful',
        data: {
          _id: adminId,
          username: username,
          token: generateToken(adminId, 'super_admin')
        }
      });
    } else {
      res.status(401).json({ status: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

// Generate JWT token
const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth turf admin & get token
// @route   POST /api/admin/turf-admin/login
// @access  Public
const loginTurfAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await TurfAdmin.findOne({ email });

    if (admin && admin.isActive && (await bcrypt.compare(password, admin.password))) {
      res.json({
        status: true,
        message: 'Login successful',
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          turfId: admin.turfId,
          token: generateToken(admin._id, 'turf_admin')
        }
      });
    } else {
      res.status(401).json({ status: false, message: 'Invalid email or password, or account deactivated' });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

module.exports = {
  authAdmin,
  loginTurfAdmin
};
