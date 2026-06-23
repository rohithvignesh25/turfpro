const Turf = require('../models/Turf');

// @desc    Create a new turf
// @route   POST /api/turfs
// @access  Private (Super Admin)
const createTurf = async (req, res) => {
  try {
    // Parse fields if they were sent as strings in form-data
    const data = { ...req.body };
    if (typeof data.sports === 'string') data.sports = JSON.parse(data.sports);
    if (typeof data.location === 'string') data.location = JSON.parse(data.location);
    if (typeof data.timeWindow === 'string') data.timeWindow = JSON.parse(data.timeWindow);

    // If an image was uploaded, add its path
    if (req.file) {
      data.image = `/${req.file.path.replace(/\\/g, '/')}`;
    }

    const turf = new Turf(data);
    const createdTurf = await turf.save();
    res.status(201).json({ status: true, message: 'Turf created successfully', data: createdTurf });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Get all turfs
// @route   GET /api/turfs
// @access  Private (Super Admin)
const getAllTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({});
    res.json({ status: true, message: 'Turfs retrieved successfully', data: turfs });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Get single turf by ID
// @route   GET /api/turfs/:id
// @access  Private (Super Admin)
const getTurfById = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (turf) {
      res.json({ status: true, message: 'Turf retrieved successfully', data: turf });
    } else {
      res.status(404).json({ status: false, message: 'Turf not found', data: null });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Update turf
// @route   PUT /api/turfs/:id
// @access  Private (Super Admin)
const updateTurf = async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.sports === 'string') data.sports = JSON.parse(data.sports);
    if (typeof data.location === 'string') data.location = JSON.parse(data.location);
    if (typeof data.timeWindow === 'string') data.timeWindow = JSON.parse(data.timeWindow);
    if (typeof data.isActive === 'string') data.isActive = data.isActive === 'true';

    // If a new image was uploaded, update its path
    if (req.file) {
      data.image = `/${req.file.path.replace(/\\/g, '/')}`;
    }

    const turf = await Turf.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (turf) {
      res.json({ status: true, message: 'Turf updated successfully', data: turf });
    } else {
      res.status(404).json({ status: false, message: 'Turf not found', data: null });
    }
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Delete turf
// @route   DELETE /api/turfs/:id
// @access  Private (Super Admin)
const deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findByIdAndDelete(req.params.id);

    if (turf) {
      res.json({ status: true, message: 'Turf removed successfully', data: null });
    } else {
      res.status(404).json({ status: false, message: 'Turf not found', data: null });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Activate or deactivate turf
// @route   PATCH /api/turfs/:id/status
// @access  Private (Super Admin)
const toggleTurfStatus = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({ status: false, message: 'Turf not found', data: null });
    }

    turf.isActive = !turf.isActive;
    const updatedTurf = await turf.save();

    res.json({ status: true, message: 'Turf status toggled successfully', data: updatedTurf });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  createTurf,
  getAllTurfs,
  getTurfById,
  updateTurf,
  deleteTurf,
  toggleTurfStatus
};
