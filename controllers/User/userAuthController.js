const User = require('../../models/User/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/user/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: false, message: 'Please provide name, email, and password', data: null });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: false, message: 'User already exists with this email', data: null });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password
    });

    if (user) {
      res.status(201).json({
        status: true,
        message: 'Registration successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          role: 'user',
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ status: false, message: 'Invalid user data', data: null });
    }
  } catch (error) {
    console.error(`Register error: ${error.message}`);
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Login user
// @route   POST /api/user/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: false, message: 'Please provide email and password', data: null });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ status: false, message: 'Invalid email or password', data: null });
    }

    if (!user.isActive) {
      return res.status(403).json({ status: false, message: 'Account is deactivated. Please contact support.', data: null });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ status: false, message: 'Invalid email or password', data: null });
    }

    res.json({
      status: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        role: 'user',
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

// @desc    Logout user
// @route   POST /api/user/auth/logout
// @access  Public / Private
const logout = async (req, res) => {
  // Client is responsible for clearing the JWT token
  res.json({
    status: true,
    message: 'Logged out successfully',
    data: null
  });
};

// @desc    Forgot password - generate OTP/Token and send email
// @route   POST /api/user/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: false, message: 'Please provide email address', data: null });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: 'There is no user registered with this email', data: null });
    }

    // Generate a 6-digit OTP for simplicity in MVP
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Set token and expiration (15 minutes)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send email via Nodemailer
    const emailSubject = 'TurfPro - Password Reset OTP';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password. Here is your One-Time Password (OTP):</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #27ae60; border-radius: 4px;">
          ${resetToken}
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #7f8c8d;">This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
      text: `Your TurfPro Password Reset OTP is: ${resetToken}. Valid for 15 minutes.`
    });

    res.json({
      status: true,
      message: 'Password reset OTP sent to email',
      data: null
    });
  } catch (error) {
    console.error(`Forgot password error: ${error.message}`);
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

// @desc    Reset password using OTP/Token
// @route   POST /api/user/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ status: false, message: 'Please provide email, otp, and newPassword', data: null });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: false, message: 'Password must be at least 6 characters long', data: null });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ status: false, message: 'Invalid OTP or OTP has expired', data: null });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'TurfPro - Password Reset Successful',
      html: `<p>Hi ${user.name}, your password has been successfully reset. You can now login with your new password.</p>`,
      text: `Hi ${user.name}, your password has been successfully reset.`
    });

    res.json({
      status: true,
      message: 'Password reset successfully. You can now login.',
      data: null
    });
  } catch (error) {
    console.error(`Reset password error: ${error.message}`);
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
};
