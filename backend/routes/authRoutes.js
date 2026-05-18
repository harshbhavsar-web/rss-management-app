const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminProfile, updateAdminProfile } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.get('/profile', protect, adminOnly, getAdminProfile);
router.put('/profile', protect, adminOnly, updateAdminProfile);

module.exports = router;
