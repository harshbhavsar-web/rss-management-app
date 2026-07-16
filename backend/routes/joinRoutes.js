const express = require('express');
const router = express.Router();
const { getJoinRequests, createJoinRequest } = require('../controllers/joinController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin'), getJoinRequests)
  .post(protect, createJoinRequest);

module.exports = router;
