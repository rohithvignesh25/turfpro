const express = require('express');
const router = express.Router();
const {
  createSlot,
  getSlots,
  updateSlot,
  blockSlot,
  unblockSlot
} = require('../../controllers/Turf_admin/slotController');
const { protect, protectTurfAdmin } = require('../../middleware/authMiddleware');

// Base route: /api/turf-admin/slots

router.route('/')
  .post(protect, protectTurfAdmin, createSlot)
  .get(protect, protectTurfAdmin, getSlots);

router.route('/:id')
  .put(protect, protectTurfAdmin, updateSlot);

router.route('/:id/block')
  .patch(protect, protectTurfAdmin, blockSlot);

router.route('/:id/unblock')
  .patch(protect, protectTurfAdmin, unblockSlot);

module.exports = router;
