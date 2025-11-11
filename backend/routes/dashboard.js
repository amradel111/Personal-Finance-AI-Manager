const express = require('express');
const authenticate = require('../middleware/authenticate');
const { getDashboardSummary, getRecentExpenses } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/summary', authenticate, getDashboardSummary);
router.get('/recent', authenticate, getRecentExpenses);

module.exports = router;
