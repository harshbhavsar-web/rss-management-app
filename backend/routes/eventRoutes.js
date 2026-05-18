const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEvents)
  .post(protect, adminOnly, createEvent);

router.route('/:id')
  .put(protect, adminOnly, updateEvent)
  .delete(protect, adminOnly, deleteEvent);

module.exports = router;
