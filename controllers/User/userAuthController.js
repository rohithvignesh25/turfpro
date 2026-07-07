const User = require('../../models/User/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user - send OTP to email
// @route   POST /api/user/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: false, message: 'Please provide name, email, and password', data: null });
    }

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ status: false, message: 'User already exists and is verified with this email. Please login.', data: null });
    }

    // Generate 6-digit verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    if (user && !user.isVerified) {
      // If user registered earlier but didn't verify, update their info and resend OTP
      user.name = name;
      user.password = password; // pre-save hook will re-hash
      user.verificationOtp = otp;
      user.verificationOtpExpire = otpExpire;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name,
        email,
        password,
        isVerified: false,
        verificationOtp: otp,
        verificationOtpExpire: otpExpire
      });
    }

    // Send verification email via Nodemailer
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'TurfPro - Verify Your Email (OTP)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Email Verification</h2>
          <p>Hi ${user.name},</p>
          <p>Thank you for signing up on TurfPro! Please use the One-Time Password (OTP) below to verify your email address:</p>
          <div style="background: #e8f8f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1abc9c; border-radius: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #7f8c8d;">This OTP is valid for 15 minutes.</p>
        </div>
      `,
      text: `Hi ${user.name}, your verification OTP is: ${otp}. It expires in 15 minutes.`
    });

    res.status(201).json({
      status: true,
      message: emailResult.status
        ? 'Registration initiated! Please verify your email with the OTP sent to your mail id.'
        : `Registration initiated! (Note: Cloud email sending failed: ${emailResult.message}. Use the devOtp below for testing.)`,
      data: {
        email: user.email,
        isVerified: false,
        ...(!emailResult.status ? { devOtp: otp, emailError: emailResult.message } : {})
      }
    });
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

    if (!user.isVerified) {
      return res.status(401).json({ status: false, message: 'Please verify your email address with OTP before logging in.', data: null });
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

    const emailResult = await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
      text: `Your TurfPro Password Reset OTP is: ${resetToken}. Valid for 15 minutes.`
    });

    res.json({
      status: true,
      message: emailResult.status ? 'Password reset OTP sent to email' : `Password reset OTP generated (Email failed: ${emailResult.message})`,
      data: !emailResult.status ? { devOtp: resetToken, emailError: emailResult.message } : null
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

// @desc    Verify Email with OTP
// @route   POST /api/user/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: false, message: 'Please provide email and verification OTP', data: null });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found with this email', data: null });
    }

    if (user.isVerified) {
      return res.status(400).json({ status: false, message: 'Email is already verified. You can login directly.', data: null });
    }

    if (user.verificationOtp !== otp) {
      return res.status(400).json({ status: false, message: 'Invalid OTP code', data: null });
    }

    if (user.verificationOtpExpire < Date.now()) {
      return res.status(400).json({ status: false, message: 'OTP has expired. Please request a new verification OTP.', data: null });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpire = undefined;
    await user.save();

    res.json({
      status: true,
      message: 'Email verified successfully! You are now registered and logged in.',
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
    console.error(`Verify email error: ${error.message}`);
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

// @desc    Resend Verification OTP
// @route   POST /api/user/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: false, message: 'Please provide email address', data: null });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found with this email', data: null });
    }

    if (user.isVerified) {
      return res.status(400).json({ status: false, message: 'Email is already verified. Please login.', data: null });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = otp;
    user.verificationOtpExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'TurfPro - Resend Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Resend Verification OTP</h2>
          <p>Hi ${user.name},</p>
          <p>Here is your new One-Time Password (OTP) to verify your account:</p>
          <div style="background: #e8f8f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1abc9c; border-radius: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #7f8c8d;">This OTP is valid for 15 minutes.</p>
        </div>
      `,
      text: `Hi ${user.name}, your new verification OTP is: ${otp}. It expires in 15 minutes.`
    });

    res.json({
      status: true,
      message: emailResult.status ? 'A new verification OTP has been sent to your email.' : `New OTP generated (Email failed: ${emailResult.message})`,
      data: {
        email: user.email,
        ...(!emailResult.status ? { devOtp: otp, emailError: emailResult.message } : {})
      }
    });
  } catch (error) {
    console.error(`Resend OTP error: ${error.message}`);
    res.status(500).json({ status: false, message: 'Server Error', data: null });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendOtp
};
