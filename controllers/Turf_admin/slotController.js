const Slot = require('../../models/Turf_admin/Slot');

// @desc    Create new slot(s)
// @route   POST /api/turf-admin/slots
// @access  Private (Turf Admin)
const createSlot = async (req, res) => {
  try {
    const turfId = req.user.turfId;
    const { sport, date, startTime, endTime } = req.body;

    // Check if slot already exists for same turf, date, sport, and time
    const existingSlot = await Slot.findOne({
      turfId,
      sport,
      date,
      startTime,
      endTime
    });

    if (existingSlot) {
      return res.status(400).json({ status: false, message: 'Slot already exists for this time and sport', data: null });
    }

    const slot = new Slot({
      turfId,
      sport,
      date,
      startTime,
      endTime
    });

    const createdSlot = await slot.save();
    res.status(201).json({ status: true, message: 'Slot created successfully', data: createdSlot });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Get slots for assigned turf
// @route   GET /api/turf-admin/slots
// @access  Private (Turf Admin)
const getSlots = async (req, res) => {
  try {
    const turfId = req.user.turfId;
    
    // Allow filtering by date and/or sport via query params
    const filter = { turfId };
    if (req.query.date) filter.date = req.query.date;
    if (req.query.sport) filter.sport = req.query.sport;

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 });
    res.json({ status: true, message: 'Slots retrieved successfully', data: slots });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Update a slot's timings
// @route   PUT /api/turf-admin/slots/:id
// @access  Private (Turf Admin)
const updateSlot = async (req, res) => {
  try {
    const { startTime, endTime, sport } = req.body;
    
    const slot = await Slot.findOne({ _id: req.params.id, turfId: req.user.turfId });

    if (!slot) {
      return res.status(404).json({ status: false, message: 'Slot not found or unauthorized', data: null });
    }

    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (sport) slot.sport = sport;

    const updatedSlot = await slot.save();
    res.json({ status: true, message: 'Slot updated successfully', data: updatedSlot });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Block a slot
// @route   PATCH /api/turf-admin/slots/:id/block
// @access  Private (Turf Admin)
const blockSlot = async (req, res) => {
  try {
    const { reason } = req.body;
    const slot = await Slot.findOne({ _id: req.params.id, turfId: req.user.turfId });

    if (!slot) {
      return res.status(404).json({ status: false, message: 'Slot not found or unauthorized', data: null });
    }

    slot.isBlocked = true;
    slot.reason = reason || 'Blocked by admin';
    
    const updatedSlot = await slot.save();
    res.json({ status: true, message: 'Slot blocked successfully', data: updatedSlot });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Unblock a slot
// @route   PATCH /api/turf-admin/slots/:id/unblock
// @access  Private (Turf Admin)
const unblockSlot = async (req, res) => {
  try {
    const slot = await Slot.findOne({ _id: req.params.id, turfId: req.user.turfId });

    if (!slot) {
      return res.status(404).json({ status: false, message: 'Slot not found or unauthorized', data: null });
    }

    slot.isBlocked = false;
    slot.reason = undefined; // Clear the reason
    
    const updatedSlot = await slot.save();
    res.json({ status: true, message: 'Slot unblocked successfully', data: updatedSlot });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  createSlot,
  getSlots,
  updateSlot,
  blockSlot,
  unblockSlot
};
