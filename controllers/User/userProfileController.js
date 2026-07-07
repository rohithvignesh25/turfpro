const User = require('../../models/User/User');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private (User)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found', data: null });
    }
    res.json({ status: true, message: 'Profile retrieved successfully', data: user });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private (User)
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found', data: null });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    const updatedUser = await user.save();
    
    // Return updated user without password
    const userData = updatedUser.toObject();
    delete userData.password;

    res.json({ status: true, message: 'Profile updated successfully', data: userData });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Change password
// @route   PUT /api/user/profile/password
// @access  Private (User)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ status: false, message: 'Please provide oldPassword and newPassword', data: null });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: false, message: 'New password must be at least 6 characters long', data: null });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found', data: null });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ status: false, message: 'Incorrect old password', data: null });
    }

    user.password = newPassword;
    await user.save();

    res.json({ status: true, message: 'Password changed successfully', data: null });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Update profile picture
// @route   PUT /api/user/profile/picture
// @access  Private (User)
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: 'Please upload an image file', data: null });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found', data: null });
    }

    user.profilePicture = `/${req.file.path.replace(/\\/g, '/')}`;
    const updatedUser = await user.save();

    const userData = updatedUser.toObject();
    delete userData.password;

    res.json({ status: true, message: 'Profile picture updated successfully', data: userData });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateProfilePicture
};
