const express = require('express');
const router = express.Router();
const { getMeetings, createMeeting, updateMeeting, deleteMeeting } = require('../controllers/meetingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMeetings)
  .post(protect, adminOnly, createMeeting);

router.route('/:id')
  .put(protect, adminOnly, updateMeeting)
  .delete(protect, adminOnly, deleteMeeting);

module.exports = router;
