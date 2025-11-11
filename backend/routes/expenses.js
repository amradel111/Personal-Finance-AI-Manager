const express = require('express');
const authenticate = require('../middleware/authenticate');
const {
  createExpenses,
  getAllExpenses,
  getExpensesByMonth,
  updateExpenses,
  deleteExpenses,
} = require('../controllers/expensesController');

const router = express.Router();

// Create monthly expenses for a month
router.post('/', authenticate, createExpenses);

// Get all expenses for the user
router.get('/', authenticate, getAllExpenses);

// Get expenses for a specific month: YYYY-MM
router.get('/:month_year', authenticate, getExpensesByMonth);

// Update a specific expense record by id
router.put('/:id', authenticate, updateExpenses);

// Delete a specific expense record by id
router.delete('/:id', authenticate, deleteExpenses);

module.exports = router;
