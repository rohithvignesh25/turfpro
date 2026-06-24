const Turf = require('../../models/Super_admin/Turf');

// @desc    Get assigned turf details
// @route   GET /api/turf-admin/turf
// @access  Private (Turf Admin)
const getTurfDetails = async (req, res) => {
  try {
    const turfId = req.user.turfId;
    const turf = await Turf.findById(turfId);

    if (turf) {
      res.json({ status: true, message: 'Turf details retrieved successfully', data: turf });
    } else {
      res.status(404).json({ status: false, message: 'Turf not found', data: null });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message, data: null });
  }
};

// @desc    Update assigned turf details
// @route   PUT /api/turf-admin/turf
// @access  Private (Turf Admin)
const updateTurfDetails = async (req, res) => {
  try {
    const turfId = req.user.turfId;
    const data = { ...req.body };

    // Parse stringified JSON fields if sent via form-data
    if (typeof data.sports === 'string') data.sports = JSON.parse(data.sports);
    if (typeof data.location === 'string') data.location = JSON.parse(data.location);
    if (typeof data.timeWindow === 'string') data.timeWindow = JSON.parse(data.timeWindow);
    if (typeof data.facilities === 'string') data.facilities = JSON.parse(data.facilities);
    if (typeof data.contactDetails === 'string') data.contactDetails = JSON.parse(data.contactDetails);
    if (typeof data.isActive === 'string') data.isActive = data.isActive === 'true';

    // If a new image was uploaded, update its path
    if (req.file) {
      data.image = `/${req.file.path.replace(/\\/g, '/')}`;
    }

    const updatedTurf = await Turf.findByIdAndUpdate(
      turfId,
      data,
      { new: true, runValidators: true }
    );

    if (updatedTurf) {
      res.json({ status: true, message: 'Turf details updated successfully', data: updatedTurf });
    } else {
      res.status(404).json({ status: false, message: 'Turf not found', data: null });
    }
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

module.exports = {
  getTurfDetails,
  updateTurfDetails
};
