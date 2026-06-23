const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  collection: 'credentials', // Specific collection requested by user
  timestamps: true
});

module.exports = mongoose.model('Credential', credentialSchema);
