const express = require('express');
const router = express.Router();
const { getMeetings, createMeeting, updateMeeting, deleteMeeting } = require('../controllers/meetingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMeetings)
  .post(protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), createMeeting);

router.route('/:id')
  .put(protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), updateMeeting)
  .delete(protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), deleteMeeting);

module.exports = router;
