const Credential = require('../../models/Super_admin/Credential');
const TurfAdmin = require('../../models/Super_admin/TurfAdmin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Auth super admin & get token
// @route   POST /api/admin/login
// @access  Public
const authAdmin = async (req, res) => {
  // Use 'email' field from the frontend payload
  const email = req.body.email || req.body.username;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ status: false, message: 'Please provide email and password', data: null });
  }

  try {
    // 1. Check for Super Admin
    if ((email === 'admin@gmail.com' && password === '123') || (email === 'admin' && password === '123')) {
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
          permissions: ['dashboard', 'turf management', 'turf admin']
        }
      });
    }

    // 2. Check for Turf Admin
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
          turfName: turfAdmin.turfId?.name,
          role: 'turf_admin',
          token: generateToken(turfAdmin._id, 'turf_admin'),
          permissions: ['dashboard', 'manage turf', 'manage timeslot']
        }
      });
    }

    // 3. If neither matched
    res.status(401).json({ status: false, message: 'Invalid credentials or account deactivated' });

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
  const email = req.body.email || req.body.username;
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: false, message: 'Please provide email and password', data: null });
  }

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
