const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private (Super Admin)
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: false, message: 'No file uploaded', data: null });
  }
  res.json({ status: true, message: 'File uploaded successfully', data: `/${req.file.path.replace(/\\/g, '/')}` });
});

module.exports = router;
