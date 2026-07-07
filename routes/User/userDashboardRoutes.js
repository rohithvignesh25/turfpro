const express = require('express');
const router = express.Router();
const { protect, protectUser } = require('../../middleware/authMiddleware');
const { getDashboardSummary } = require('../../controllers/User/userDashboardController');

router.get('/', protect, protectUser, getDashboardSummary);

module.exports = router;
