const express = require('express');
const router = express.Router();
const {
  createTurfAdmin,
  getAllTurfAdmins,
  getTurfAdminById,
  updateTurfAdmin,
  toggleTurfAdminStatus,
  resetTurfAdminPassword,
  deleteTurfAdmin
} = require('../../controllers/Super_admin/turfAdminController');
const { protect, protectSuperAdmin } = require('../../middleware/authMiddleware');

// All routes below are restricted strictly to Super Admins
router.route('/')
  .post(protect, protectSuperAdmin, createTurfAdmin)
  .get(protect, protectSuperAdmin, getAllTurfAdmins);

router.route('/:id')
  .get(protect, protectSuperAdmin, getTurfAdminById)
  .put(protect, protectSuperAdmin, updateTurfAdmin)
  .delete(protect, protectSuperAdmin, deleteTurfAdmin);

router.post('/:id/status', protect, protectSuperAdmin, toggleTurfAdminStatus);
router.post('/:id/reset-password', protect, resetTurfAdminPassword);

module.exports = router;
