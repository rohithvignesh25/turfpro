const Turf = require('../../models/Super_admin/Turf');
const Slot = require('../../models/Turf_admin/Slot');
const Booking = require('../../models/User/Booking');

// Helper to convert time string like "06:00 AM" or "14:00" to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = timeStr.trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper to convert minutes from midnight to "hh:mm AM/PM" format
const formatMinutesToTime = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const hoursStr = hours < 10 ? `0${hours}` : hours;
  return `${hoursStr}:${minutesStr} ${period}`;
};

// @desc    Browse all active turfs (with search and filters)
// @route   GET /api/user/turfs
// @access  Public
const browseTurfs = async (req, res) => {
  try {
    const { search, sport, location } = req.query;
    const query = { isActive: true };

    // Search by name or address
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by sport
    if (sport) {
      query['sports.sport'] = { $regex: new RegExp(`^${sport}$`, 'i') };
    }

    // Filter by location / city string in address
    if (location) {
      query.address = { $regex: location, $options: 'i' };
    }

    const turfs = await Turf.find(query).sort({ createdAt: -1 });
    res.json({
      status: true,
      message: 'Turfs retrieved successfully',
      count: turfs.length,
      data: turfs
    });
  } catch (error) {
    console.error(`Browse turfs error: ${error.message}`);
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Get specific turf details
// @route   GET /api/user/turfs/:id
// @access  Public
const getTurfDetails = async (req, res) => {
  try {
    const turf = await Turf.findOne({ _id: req.params.id, isActive: true });

    if (!turf) {
      return res.status(404).json({ status: false, message: 'Turf not found or inactive', data: null });
    }

    res.json({
      status: true,
      message: 'Turf details retrieved successfully',
      data: turf
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Get available slots for a turf on a given date
// @route   GET /api/user/turfs/:id/slots
// @access  Public
const getAvailableSlots = async (req, res) => {
  try {
    const { date, sport } = req.query;
    const turfId = req.params.id;

    if (!date) {
      return res.status(400).json({ status: false, message: 'Please provide a date (YYYY-MM-DD)', data: null });
    }

    const turf = await Turf.findOne({ _id: turfId, isActive: true });
    if (!turf) {
      return res.status(404).json({ status: false, message: 'Turf not found or inactive', data: null });
    }

    // Get all pre-created slots for this turf, date, and optional sport
    const slotQuery = { turfId, date };
    if (sport) slotQuery.sport = { $regex: new RegExp(`^${sport}$`, 'i') };
    const adminSlots = await Slot.find(slotQuery);

    // Get all confirmed bookings for this turf and date
    const bookingQuery = { turfId, date, status: 'confirmed' };
    if (sport) bookingQuery.sport = { $regex: new RegExp(`^${sport}$`, 'i') };
    const confirmedBookings = await Booking.find(bookingQuery);

    // Helper to check if a time interval is already booked
    const isTimeBooked = (start, end, sportName) => {
      return confirmedBookings.some(b => {
        if (sportName && b.sport.toLowerCase() !== sportName.toLowerCase()) return false;
        return (b.startTime === start && b.endTime === end);
      });
    };

    let availableSlots = [];

    if (adminSlots.length > 0) {
      // If admin explicitly generated slots in DB for this date, use them
      adminSlots.forEach(s => {
        if (!s.isBlocked && !s.isBooked && !isTimeBooked(s.startTime, s.endTime, s.sport)) {
          availableSlots.push({
            _id: s._id,
            turfId: s.turfId,
            sport: s.sport,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            isGenerated: false
          });
        }
      });
    } else {
      // Fallback: Dynamically generate 1-hour slots based on turf timeWindows and sports
      const sportsList = sport 
        ? turf.sports.filter(s => s.sport.toLowerCase() === sport.toLowerCase()) 
        : turf.sports;

      if (turf.timeWindow && turf.timeWindow.length > 0) {
        turf.timeWindow.forEach(window => {
          const startMin = parseTimeToMinutes(window.openTime);
          const endMin = parseTimeToMinutes(window.closeTime);

          // Generate 60-minute slots
          for (let m = startMin; m + 60 <= endMin; m += 60) {
            const startStr = formatMinutesToTime(m);
            const endStr = formatMinutesToTime(m + 60);

            sportsList.forEach(sp => {
              if (!isTimeBooked(startStr, endStr, sp.sport)) {
                availableSlots.push({
                  turfId: turf._id,
                  sport: sp.sport,
                  date: date,
                  startTime: startStr,
                  endTime: endStr,
                  pricePerHour: sp.pricePerHour,
                  isGenerated: true
                });
              }
            });
          }
        });
      }
    }

    res.json({
      status: true,
      message: 'Available slots retrieved successfully',
      count: availableSlots.length,
      data: availableSlots
    });
  } catch (error) {
    console.error(`Get available slots error: ${error.message}`);
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  browseTurfs,
  getTurfDetails,
  getAvailableSlots
};
