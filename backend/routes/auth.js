const express = require('express');
const { signup, login, getProfile } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);

module.exports = router;
