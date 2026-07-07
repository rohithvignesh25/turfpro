const Notification = require('../../models/User/Notification');

// @desc    Get user notifications
// @route   GET /api/user/notifications
// @access  Private (User)
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.json({
      status: true,
      message: 'Notifications retrieved successfully',
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/user/notifications/:id/read
// @access  Private (User)
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });

    if (!notification) {
      return res.status(404).json({ status: false, message: 'Notification not found', data: null });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ status: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/user/notifications/read-all
// @access  Private (User)
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ status: true, message: 'All notifications marked as read', data: null });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
