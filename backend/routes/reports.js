const express = require('express');
const authenticate = require('../middleware/authenticate');
const { getMonthlyReport, getReportHistory } = require('../controllers/reportsController');

const router = express.Router();

// GET /api/reports/monthly/:month_year (YYYY-MM)
router.get('/monthly/:month_year', authenticate, getMonthlyReport);

// GET /api/reports/history
router.get('/history', authenticate, getReportHistory);

module.exports = router;
