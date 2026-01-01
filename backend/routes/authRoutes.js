const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, resendOtp, forgotPassword, verifyResetOtp, resetPassword, updatePassword, toggleTwoFactor, verifyLoginOtp, updateProfile, addEmergencyContact } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.put('/update-password', authMiddleware, updatePassword);
router.put('/toggle-2fa', authMiddleware, toggleTwoFactor);
router.put('/update-profile', authMiddleware, updateProfile);
router.put('/emergency-contact', authMiddleware, addEmergencyContact);
router.get('/me', authMiddleware, getMe);

module.exports = router;
