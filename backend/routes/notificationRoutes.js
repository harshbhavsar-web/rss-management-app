const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, markAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getNotifications)
  .post(protect, authorize('admin'), createNotification);

router.route('/:id/read')
  .put(protect, markAsRead);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteNotification);

module.exports = router;
