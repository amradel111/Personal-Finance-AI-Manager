const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalsController');

// All goal routes require authentication
router.use(authenticate);

router.get('/', getAllGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
