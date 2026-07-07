const express = require('express');
const router = express.Router();
const { protect, protectUser } = require('../../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../../controllers/User/userNotificationController');

router.use(protect, protectUser);

router.get('/', getNotifications);
router.post('/read-all', markAllAsRead);
router.post('/:id/read', markAsRead);

module.exports = router;
