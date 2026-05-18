const express = require('express');
const router = express.Router();
const { getMeetingAttendance, updateMeetingAttendance, getUserAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

// Custom middleware to restrict to specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Insufficient privileges' });
    }
  };
};

router.get('/my-attendance', protect, getUserAttendance);

// Only admin, karyavah, and shikshak can manage attendance
router.get('/:meetingId', protect, authorizeRoles('admin', 'karyavah', 'shikshak'), getMeetingAttendance);
router.put('/:meetingId', protect, authorizeRoles('admin', 'karyavah', 'shikshak'), updateMeetingAttendance);

module.exports = router;
