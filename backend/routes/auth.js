const express = require('express');
const {
	signup,
	login,
	getProfile,
	checkProfileStatus,
	updateAccount,
	changePassword,
	requestPasswordReset,
	resetPassword
} = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.get('/check-profile', authenticate, checkProfileStatus);
router.put('/update-account', authenticate, updateAccount);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
