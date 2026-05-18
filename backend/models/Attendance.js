const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'absent'
  }
}, { _id: false });

const AttendanceSchema = new mongoose.Schema({
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    unique: true
  },
  records: [AttendanceRecordSchema]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
