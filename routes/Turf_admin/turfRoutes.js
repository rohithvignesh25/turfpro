const express = require('express');
const router = express.Router();
const { getTurfDetails, updateTurfDetails } = require('../../controllers/Turf_admin/turfController');
const { protect, protectTurfAdmin } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

// Base route: /api/turf-admin/turf
router.route('/')
  .get(protect, protectTurfAdmin, getTurfDetails)
  .put(protect, protectTurfAdmin, upload.single('image'), updateTurfDetails);

module.exports = router;
