const TurfAdmin = require('../models/TurfAdmin');
const Turf = require('../models/Turf');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper for generating JWT
const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth turf admin & get token
// @route   POST /api/turf-admins/login
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

// @desc    Create a new turf admin
// @route   POST /api/turf-admins
// @access  Private (Super Admin)
const createTurfAdmin = async (req, res) => {
  try {
    const { name, email, password, turfId } = req.body;

    // Check if turf exists
    const turfExists = await Turf.findById(turfId);
    if (!turfExists) {
      return res.status(400).json({ message: 'Assigned Turf not found' });
    }

    // Check if email already exists
    const adminExists = await TurfAdmin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Turf Admin with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new TurfAdmin({
      name,
      email,
      password: hashedPassword,
      turfId
    });

    const createdAdmin = await admin.save();

    // Don't return password
    const adminResponse = createdAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json(adminResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all turf admins
// @route   GET /api/turf-admins
// @access  Private (Super Admin)
const getAllTurfAdmins = async (req, res) => {
  try {
    const admins = await TurfAdmin.find({}).populate('turfId', 'name address').select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single turf admin by ID
// @route   GET /api/turf-admins/:id
// @access  Private (Super Admin)
const getTurfAdminById = async (req, res) => {
  try {
    const admin = await TurfAdmin.findById(req.params.id).populate('turfId', 'name address').select('-password');
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Turf Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update turf admin
// @route   PUT /api/turf-admins/:id
// @access  Private (Super Admin)
const updateTurfAdmin = async (req, res) => {
  try {
    const { name, email, turfId } = req.body;

    const admin = await TurfAdmin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Turf Admin not found' });
    }

    if (turfId) {
      const turfExists = await Turf.findById(turfId);
      if (!turfExists) {
        return res.status(400).json({ message: 'Assigned Turf not found' });
      }
      admin.turfId = turfId;
    }

    if (name) admin.name = name;
    if (email) admin.email = email;

    const updatedAdmin = await admin.save();

    const adminResponse = updatedAdmin.toObject();
    delete adminResponse.password;

    res.json(adminResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Activate or deactivate turf admin
// @route   POST /api/turf-admins/:id/status
// @access  Private (Super Admin)
const toggleTurfAdminStatus = async (req, res) => {
  try {
    const admin = await TurfAdmin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Turf Admin not found' });
    }

    admin.isActive = !admin.isActive;
    const updatedAdmin = await admin.save();

    const adminResponse = updatedAdmin.toObject();
    delete adminResponse.password;

    res.json(adminResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reset turf admin password
// @route   POST /api/turf-admins/:id/reset-password
// @access  Private (Super Admin or the specific Turf Admin)
const resetTurfAdminPassword = async (req, res) => {
  try {
    // Authorization check: Super Admin can reset anyone, Turf Admin can only reset themselves
    if (req.userType === 'turf_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to reset this password' });
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'Please provide newPassword' });
    }

    const admin = await TurfAdmin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Turf Admin not found' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  loginTurfAdmin,
  createTurfAdmin,
  getAllTurfAdmins,
  getTurfAdminById,
  updateTurfAdmin,
  toggleTurfAdminStatus,
  resetTurfAdminPassword
};
