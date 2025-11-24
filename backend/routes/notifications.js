const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  sendMonthlyReportReminder,
  sendBudgetAlert,
  sendFinancialHealthAlert,
} = require('../utils/emailService');

/**
 * POST /api/notifications/monthly-reminder
 * Send a monthly report reminder to the authenticated user
 */
router.post('/monthly-reminder', authenticate, async (req, res) => {
  try {
    const { email, firstName } = req.user;

    await sendMonthlyReportReminder({
      to: email,
      firstName,
      lastReportMonth: req.body.lastReportMonth || null,
    });

    res.json({
      success: true,
      message: 'Monthly report reminder sent successfully',
    });
  } catch (error) {
    console.error('Error sending monthly reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send monthly reminder',
      error: error.message,
    });
  }
});

/**
 * POST /api/notifications/budget-alert
 * Send a budget alert to the authenticated user
 * Body: { category, spent, budget, percentageUsed }
 */
router.post('/budget-alert', authenticate, async (req, res) => {
  try {
    const { email, firstName } = req.user;
    const { category, spent, budget, percentageUsed } = req.body;

    if (!category || spent === undefined || !budget || !percentageUsed) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category, spent, budget, percentageUsed',
      });
    }

    await sendBudgetAlert({
      to: email,
      firstName,
      category,
      spent: Number(spent),
      budget: Number(budget),
      percentageUsed: Number(percentageUsed),
    });

    res.json({
      success: true,
      message: 'Budget alert sent successfully',
    });
  } catch (error) {
    console.error('Error sending budget alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send budget alert',
      error: error.message,
    });
  }
});

/**
 * POST /api/notifications/health-alert
 * Send a financial health alert to the authenticated user
 * Body: { alertType, details }
 * alertType: 'low-health-score' | 'no-emergency-fund' | 'high-debt' | 'overspending' | 'low-savings-rate'
 */
router.post('/health-alert', authenticate, async (req, res) => {
  try {
    const { email, firstName } = req.user;
    const { alertType, details } = req.body;

    const validAlertTypes = [
      'low-health-score',
      'no-emergency-fund',
      'high-debt',
      'overspending',
      'low-savings-rate',
    ];

    if (!alertType || !validAlertTypes.includes(alertType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid alertType. Must be one of: ${validAlertTypes.join(', ')}`,
      });
    }

    await sendFinancialHealthAlert({
      to: email,
      firstName,
      alertType,
      details: details || {},
    });

    res.json({
      success: true,
      message: 'Financial health alert sent successfully',
    });
  } catch (error) {
    console.error('Error sending health alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send health alert',
      error: error.message,
    });
  }
});

module.exports = router;
