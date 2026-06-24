const express = require('express');
const router = express.Router();
const { unifiedLogin } = require('../controllers/authController');

// POST /api/auth/login (Unified Login)
router.post('/login', unifiedLogin);

module.exports = router;
