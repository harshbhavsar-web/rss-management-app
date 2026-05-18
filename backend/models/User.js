const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    default: undefined,
    set: (val) => val === '' ? undefined : val
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits'],
    default: undefined,
    set: (val) => val === '' ? undefined : val
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  otp: {
    type: String,
  },
  otpType: {
    type: String,
    enum: ['email', 'phone'],
  },
  otpExpiry: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetOtp: {
    type: String,
  },
  resetOtpExpiry: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'karyavah', 'shikshak', 'member'],
    default: 'user',
  },
  nagar: {
    type: String,
  },
  shakha: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shakha',
    default: null
  },
  profilePhoto: {
    type: String,
    default: null
  },
  hasJoinRequest: {
    type: Boolean,
    default: false
  },
  readNotifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
