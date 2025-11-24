const express = require('express');
const router = express.Router();
const budgetsController = require('../controllers/budgetsController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, budgetsController.getBudgets);
router.post('/', authenticate, budgetsController.upsertBudget);

module.exports = router;
