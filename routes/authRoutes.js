const express = require('express');
const router = express.Router();
const { authAdmin, loginTurfAdmin } = require('../controllers/authController');

// POST /api/admin/login (Super Admin Login)
router.post('/login', authAdmin);

// POST /api/admin/turf-admin/login (Turf Admin Login)
router.post('/turf-admin/login', loginTurfAdmin);

module.exports = router;
