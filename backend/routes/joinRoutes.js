const express = require('express');
const router = express.Router();
const { getJoinRequests, createJoinRequest } = require('../controllers/joinController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getJoinRequests)
  .post(protect, createJoinRequest);

module.exports = router;
