const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendOtp
} = require('../../controllers/User/userAuthController');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/verify-otp', verifyEmail); // alias
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
