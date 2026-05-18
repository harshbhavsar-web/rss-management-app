const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('JoinRequest', JoinRequestSchema);
