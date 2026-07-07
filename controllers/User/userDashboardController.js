const Booking = require('../../models/User/Booking');
const Turf = require('../../models/Super_admin/Turf');

// @desc    Get user dashboard summary
// @route   GET /api/user/dashboard
// @access  Private (User)
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Upcoming bookings (confirmed and date >= today)
    const upcomingBookings = await Booking.find({
      userId,
      status: 'confirmed',
      date: { $gte: todayStr }
    })
      .populate('turfId', 'name address image location googleMapLink contactDetails')
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    // Recent / History bookings
    const recentBookings = await Booking.find({
      userId,
      $or: [
        { date: { $lt: todayStr } },
        { status: { $ne: 'confirmed' } }
      ]
    })
      .populate('turfId', 'name address image location')
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    // Quick access to book a turf (active turfs)
    const quickAccessTurfs = await Turf.find({ isActive: true })
      .select('name address image sports location facilities')
      .limit(6);

    // Summary counts
    const totalBookingsCount = await Booking.countDocuments({ userId });
    const upcomingBookingsCount = await Booking.countDocuments({
      userId,
      status: 'confirmed',
      date: { $gte: todayStr }
    });

    res.json({
      status: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        stats: {
          totalBookings: totalBookingsCount,
          upcomingBookings: upcomingBookingsCount
        },
        upcomingBookings,
        recentBookings,
        quickAccessTurfs
      }
    });
  } catch (error) {
    console.error(`Dashboard summary error: ${error.message}`);
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  getDashboardSummary
};
