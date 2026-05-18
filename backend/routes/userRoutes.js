const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, loginUser, resendOTP, forgotPassword, resetPassword, getUserProfile, updateUserProfile, onboardUser, getAllUsers, updateUserAdmin } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Profile routes
router.get('/me', protect, getUserProfile);
router.put('/update', protect, updateUserProfile);
router.put('/onboard', protect, onboardUser);

// Admin routes
router.get('/', protect, adminOnly, getAllUsers);
router.get('/all', protect, adminOnly, getAllUsers);
router.put('/:id', protect, adminOnly, updateUserAdmin);

module.exports = router;
