const prisma = require('../config/database');
const { computeGoalProgressForUser } = require('../utils/goals');

/**
 * GET /api/goals
 * Fetch all goals for the authenticated user
 */
const getAllGoals = async (req, res) => {
  try {
    const userId = req.user.id;

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch user's expense history to compute progress
    const expenses = await prisma.monthlyExpense.findMany({
      where: { userId },
      orderBy: { monthYear: 'asc' },
    });

    const goalsWithProgress = computeGoalProgressForUser(goals, expenses);

    return res.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error('Get all goals error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/goals
 * Create a new goal
 */
const createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      type,
      targetAmount,
      monthlyTargetAmount,
      startMonthYear,
      targetMonthYear,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Goal name is required' });
    }

    if (!type || !['total', 'monthly', 'emergency_fund', 'home', 'retirement', 'education', 'other', 'custom'].includes(type)) {
      return res.status(400).json({ error: 'Valid goal type is required' });
    }

    // Must have either targetAmount or monthlyTargetAmount
    if ((targetAmount === null || targetAmount === undefined) && 
        (monthlyTargetAmount === null || monthlyTargetAmount === undefined)) {
      return res.status(400).json({ 
        error: 'Either targetAmount or monthlyTargetAmount must be provided' 
      });
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        name: name.trim(),
        type,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        monthlyTargetAmount: monthlyTargetAmount ? parseFloat(monthlyTargetAmount) : null,
        startMonthYear: startMonthYear || null,
        targetMonthYear: targetMonthYear || null,
        status: 'active',
      },
    });

    // Compute progress for the newly created goal
    const expenses = await prisma.monthlyExpense.findMany({
      where: { userId },
      orderBy: { monthYear: 'asc' },
    });

    const [goalWithProgress] = computeGoalProgressForUser([goal], expenses);

    return res.status(201).json({ goal: goalWithProgress });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/goals/:id
 * Update an existing goal
 */
const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name,
      type,
      targetAmount,
      monthlyTargetAmount,
      startMonthYear,
      targetMonthYear,
      status,
    } = req.body;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findUnique({ where: { id } });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    if (existingGoal.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validation
    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ error: 'Goal name cannot be empty' });
    }

    if (type !== undefined && !['total', 'monthly', 'emergency_fund', 'home', 'retirement', 'education', 'other', 'custom'].includes(type)) {
      return res.status(400).json({ error: 'Invalid goal type' });
    }

    if (status !== undefined && !['active', 'completed', 'paused', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount !== null ? parseFloat(targetAmount) : null;
    if (monthlyTargetAmount !== undefined) updateData.monthlyTargetAmount = monthlyTargetAmount !== null ? parseFloat(monthlyTargetAmount) : null;
    if (startMonthYear !== undefined) updateData.startMonthYear = startMonthYear;
    if (targetMonthYear !== undefined) updateData.targetMonthYear = targetMonthYear;
    if (status !== undefined) updateData.status = status;

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    // Compute progress
    const expenses = await prisma.monthlyExpense.findMany({
      where: { userId },
      orderBy: { monthYear: 'asc' },
    });

    const [goalWithProgress] = computeGoalProgressForUser([updatedGoal], expenses);

    return res.json({ goal: goalWithProgress });
  } catch (error) {
    console.error('Update goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existingGoal = await prisma.goal.findUnique({ where: { id } });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    if (existingGoal.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.goal.delete({ where: { id } });

    return res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};
