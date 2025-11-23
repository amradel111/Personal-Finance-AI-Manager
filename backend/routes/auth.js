const express = require('express');
const { signup, login, getProfile, checkProfileStatus, updateAccount, changePassword } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.get('/check-profile', authenticate, checkProfileStatus);
router.put('/update-account', authenticate, updateAccount);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
