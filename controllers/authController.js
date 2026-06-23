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
    // Find the specific credential in the collection
    const credential = await Credential.findOne({ username });

    // Validate the credentials
    if (credential && credential.password === password) {
      res.json({
        _id: credential._id,
        username: credential.username,
        token: generateToken(credential._id, 'super_admin')
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
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
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        turfId: admin.turfId,
        token: generateToken(admin._id, 'turf_admin')
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password, or account deactivated' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  authAdmin,
  loginTurfAdmin
};
