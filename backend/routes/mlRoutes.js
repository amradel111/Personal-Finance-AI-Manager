/**
 * ML Routes
 * Routes for ML service integration.
 */

const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const authenticate = require('../middleware/authenticate');

// Check ML service health (public)
router.get('/health', mlController.checkHealth);

// Process all users (protected - should be admin only in production)
router.post('/process-all-users', authenticate, mlController.processAllUsers);

// Get insights for a specific user (protected)
router.get('/user-insights/:userId', authenticate, mlController.getUserInsights);

// Process all historical months for the current user (protected)
router.post('/process-history', authenticate, mlController.processUserHistory);

module.exports = router;
