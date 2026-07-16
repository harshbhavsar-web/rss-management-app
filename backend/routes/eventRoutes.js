const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEvents)
  .post(protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), createEvent);

router.route('/:id')
  .put(protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), updateEvent)
  .delete(protect, authorize('admin', 'karyvah', 'mukhya_shikshak'), deleteEvent);

module.exports = router;
