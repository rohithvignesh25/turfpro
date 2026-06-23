const express = require('express');
const router = express.Router();
const {
  createTurf,
  getAllTurfs,
  getTurfById,
  updateTurf,
  deleteTurf,
  toggleTurfStatus
} = require('../controllers/turfController');
const { protect, protectSuperAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All turf routes are protected by Super Admin auth middleware
router.route('/')
  .post(protect, protectSuperAdmin, upload.single('image'), createTurf)
  .get(protect, protectSuperAdmin, getAllTurfs);

router.route('/:id')
  .get(protect, protectSuperAdmin, getTurfById)
  .put(protect, protectSuperAdmin, upload.single('image'), updateTurf)
  .delete(protect, protectSuperAdmin, deleteTurf);

router.route('/:id/status')
  .post(protect, protectSuperAdmin, toggleTurfStatus);

module.exports = router;
