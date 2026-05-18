const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
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
  type: {
    type: String,
    enum: ['nagar-level', 'shakha-level'],
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
