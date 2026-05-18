const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, markAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getNotifications)
  .post(protect, adminOnly, createNotification);

router.route('/:id/read')
  .put(protect, markAsRead);

router.route('/:id')
  .delete(protect, adminOnly, deleteNotification);

module.exports = router;
