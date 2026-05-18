const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    default: 'Nagar Baithak'
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
  date: {
    type: String, // Storing as YYYY-MM-DD or readable string
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);
