const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  shakhas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shakha',
  }],
  targetType: {
    type: String,
    enum: ['all', 'shakha', 'nagar', 'group'],
    default: 'all'
  },
  targetValue: {
    type: mongoose.Schema.Types.Mixed
  },
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
