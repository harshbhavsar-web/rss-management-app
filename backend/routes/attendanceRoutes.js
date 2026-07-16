const express = require('express');
const router = express.Router();
const { getMeetingAttendance, updateMeetingAttendance, getUserAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-attendance', protect, getUserAttendance);

// Only admin, karyvah, and mukhya_shikshak can manage attendance
router.get('/:meetingId', protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), getMeetingAttendance);
router.put('/:meetingId', protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), updateMeetingAttendance);

module.exports = router;
