const express = require('express');
const authenticate = require('../middleware/authenticate');
const { createProfile, getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.post('/', authenticate, createProfile);
router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);

module.exports = router;
