const Booking = require('../../models/User/Booking');
const Turf = require('../../models/Super_admin/Turf');
const Slot = require('../../models/Turf_admin/Slot');
const Notification = require('../../models/User/Notification');
const { sendEmail } = require('../../utils/emailService');

// Helper to check if a match start time is at least X hours in the future
const isAtLeastXHoursAway = (dateStr, startTimeStr, hours = 2) => {
  try {
    // Parse date YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Parse time like "10:00 AM" or "14:00"
    const match = startTimeStr.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return true; // If parsing fails, allow by default

    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3];

    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    const matchDate = new Date(year, month - 1, day, h, m, 0);
    const now = new Date();
    const diffHours = (matchDate - now) / (1000 * 60 * 60);

    return diffHours >= hours;
  } catch (err) {
    return true;
  }
};

// @desc    Book a slot
// @route   POST /api/user/bookings
// @access  Private (User)
const createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const { turfId, slotId, sport, date, startTime, endTime, totalPrice } = req.body;

    if (!turfId || !sport || !date || !startTime || !endTime) {
      return res.status(400).json({ status: false, message: 'Please provide turfId, sport, date, startTime, and endTime', data: null });
    }

    const turf = await Turf.findOne({ _id: turfId, isActive: true });
    if (!turf) {
      return res.status(404).json({ status: false, message: 'Turf not found or inactive', data: null });
    }

    // Check if there is already a confirmed booking for this exact time and turf
    const existingBooking = await Booking.findOne({
      turfId,
      date,
      startTime,
      endTime,
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({ status: false, message: 'This slot has already been booked', data: null });
    }

    // If a specific slotId was provided or if an admin Slot exists, verify it isn't blocked/booked
    let slot = null;
    if (slotId) {
      slot = await Slot.findById(slotId);
    } else {
      slot = await Slot.findOne({ turfId, date, startTime, endTime });
    }

    if (slot && (slot.isBlocked || slot.isBooked)) {
      return res.status(400).json({ status: false, message: 'This slot is blocked or no longer available', data: null });
    }

    // Determine price
    let calculatedPrice = totalPrice;
    if (!calculatedPrice) {
      const sportObj = turf.sports.find(s => s.sport.toLowerCase() === sport.toLowerCase());
      calculatedPrice = sportObj ? sportObj.pricePerHour : 1000;
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      turfId,
      slotId: slot ? slot._id : undefined,
      sport,
      date,
      startTime,
      endTime,
      totalPrice: calculatedPrice,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    // Mark slot as booked if slot document exists
    if (slot) {
      slot.isBooked = true;
      slot.bookingId = booking._id;
      await slot.save();
    }

    // Create confirmation notification
    const title = 'Booking Confirmed!';
    const message = `Your ${sport} match at ${turf.name} on ${date} (${startTime} - ${endTime}) is confirmed.`;
    await Notification.create({
      userId,
      title,
      message,
      type: 'booking_confirmation',
      relatedId: booking._id
    });

    // Send confirmation email via Nodemailer
    await sendEmail({
      to: req.user.email,
      subject: `TurfPro - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #27ae60;">${title}</h2>
          <p>Hi ${req.user.name}, your booking has been successfully confirmed!</p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0;">
            <p><strong>Turf:</strong> ${turf.name}</p>
            <p><strong>Sport:</strong> ${sport}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
            <p><strong>Total Amount:</strong> ₹${calculatedPrice}</p>
            <p><strong>Address:</strong> ${turf.address}</p>
          </div>
          <p>We look forward to seeing you on the pitch!</p>
        </div>
      `,
      text: `${title}\nTurf: ${turf.name}\nDate: ${date}\nTime: ${startTime} - ${endTime}\nAmount: ₹${calculatedPrice}`
    });

    res.status(201).json({
      status: true,
      message: 'Slot booked successfully',
      data: booking
    });
  } catch (error) {
    console.error(`Create booking error: ${error.message}`);
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Get logged in user's bookings (upcoming or history)
// @route   GET /api/user/bookings
// @access  Private (User)
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query; // 'upcoming' or 'history'
    const todayStr = new Date().toISOString().split('T')[0];

    let query = { userId };

    if (type === 'upcoming') {
      query.status = 'confirmed';
      query.date = { $gte: todayStr };
    } else if (type === 'history') {
      query.$or = [
        { date: { $lt: todayStr } },
        { status: { $ne: 'confirmed' } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('turfId', 'name address image location googleMapLink contactDetails')
      .sort({ date: type === 'history' ? -1 : 1, startTime: 1 });

    res.json({
      status: true,
      message: 'Bookings retrieved successfully',
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Get single booking details
// @route   GET /api/user/bookings/:id
// @access  Private (User)
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('turfId', 'name address image location googleMapLink contactDetails facilities');

    if (!booking) {
      return res.status(404).json({ status: false, message: 'Booking not found', data: null });
    }

    res.json({
      status: true,
      message: 'Booking details retrieved successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/user/bookings/:id/cancel
// @access  Private (User)
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('turfId', 'name address');

    if (!booking) {
      return res.status(404).json({ status: false, message: 'Booking not found', data: null });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ status: false, message: `Cannot cancel a booking with status: ${booking.status}`, data: null });
    }

    // Enforce 2-hour cancellation rule
    if (!isAtLeastXHoursAway(booking.date, booking.startTime, 2)) {
      return res.status(400).json({ status: false, message: 'Bookings can only be cancelled at least 2 hours before the start time', data: null });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Free up Slot if linked
    if (booking.slotId) {
      const slot = await Slot.findById(booking.slotId);
      if (slot) {
        slot.isBooked = false;
        slot.bookingId = undefined;
        await slot.save();
      }
    } else {
      // Find any slot linked to this booking
      const slot = await Slot.findOne({ bookingId: booking._id });
      if (slot) {
        slot.isBooked = false;
        slot.bookingId = undefined;
        await slot.save();
      }
    }

    const turfName = booking.turfId ? booking.turfId.name : 'the turf';

    // Create cancellation notification
    const title = 'Booking Cancelled';
    const message = `Your match at ${turfName} on ${booking.date} (${booking.startTime}) has been cancelled.`;
    await Notification.create({
      userId: req.user._id,
      title,
      message,
      type: 'booking_cancellation',
      relatedId: booking._id
    });

    // Send cancellation email via Nodemailer
    await sendEmail({
      to: req.user.email,
      subject: `TurfPro - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #e74c3c;">${title}</h2>
          <p>Hi ${req.user.name}, your booking has been cancelled as requested.</p>
          <div style="background: #fdf2f2; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
            <p><strong>Turf:</strong> ${turfName}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
            <p><strong>Status:</strong> Refund initiated (if paid online)</p>
          </div>
        </div>
      `,
      text: `${title}\nTurf: ${turfName}\nDate: ${booking.date}\nTime: ${booking.startTime} - ${booking.endTime}`
    });

    res.json({
      status: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error(`Cancel booking error: ${error.message}`);
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingDetails,
  cancelBooking
};
