const mongoose = require('mongoose');

const timeWindowSchema = new mongoose.Schema({
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true }
}, { _id: false });

const sportSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  pricePerHour: { type: Number, required: true }
}, { _id: false });

const turfSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  sports: [sportSchema],
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  image: {
    type: String,
    required: true
  },
  timeWindow: [timeWindowSchema], // Array to support multiple windows in a single day
  googleMapLink: {
    type: String,
    required: true
  },
  upiId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'turfs',
  timestamps: true
});

module.exports = mongoose.model('Turf', turfSchema);
