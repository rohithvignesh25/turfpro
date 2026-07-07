const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  turfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String, // e.g., "10:00 AM"
    required: true
  },
  endTime: {
    type: String, // e.g., "11:00 AM"
    required: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);
