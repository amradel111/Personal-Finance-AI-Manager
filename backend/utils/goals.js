/**
 * Compute goal progress for a list of user goals based on their expense history.
 * 
 * @param {Array} goals - Array of goal records from database
 * @param {Array} expenses - Array of monthly expense records (sorted ascending by monthYear)
 * @returns {Array} Goals enriched with progress data
 */
const computeGoalProgressForUser = (goals, expenses) => {
  return goals.map((goal) => {
    const progress = computeSingleGoalProgress(goal, expenses);
    return {
      ...goal,
      progress,
    };
  });
};

/**
 * Compute progress for a single goal.
 * 
 * @param {Object} goal - A single goal record
 * @param {Array} expenses - Array of monthly expense records (sorted ascending)
 * @returns {Object} Progress details
 */
const computeSingleGoalProgress = (goal, expenses) => {
  const { startMonthYear, targetMonthYear, targetAmount, monthlyTargetAmount } = goal;

  // Filter expenses within goal timeframe
  let relevantExpenses = expenses;
  if (startMonthYear) {
    const startDate = new Date(startMonthYear);
    relevantExpenses = relevantExpenses.filter(
      (exp) => new Date(exp.monthYear) >= startDate
    );
  }
  if (targetMonthYear) {
    const targetDate = new Date(targetMonthYear);
    relevantExpenses = relevantExpenses.filter(
      (exp) => new Date(exp.monthYear) <= targetDate
    );
  }

  // Calculate contributions (sum of savings from each month)
  const totalContribution = relevantExpenses.reduce(
    (sum, exp) => sum + (exp.savingsThisMonth || 0),
    0
  );

  const monthCount = relevantExpenses.length;
  const averageMonthlyContribution = monthCount > 0 ? totalContribution / monthCount : 0;
  const lastContribution = relevantExpenses.length > 0 
    ? relevantExpenses[relevantExpenses.length - 1].savingsThisMonth || 0
    : 0;

  // Progress tracking for total amount goals
  let progressPercent = null;
  let remainingAmount = null;
  let monthsRemaining = null;
  let estimatedCompletionMonth = null;
  let onTrack = null;
  let paceStatus = 'neutral';

  if (targetAmount !== null && targetAmount > 0) {
    progressPercent = Math.min(1.0, totalContribution / targetAmount);
    remainingAmount = Math.max(0, targetAmount - totalContribution);

    if (targetMonthYear && startMonthYear) {
      const start = new Date(startMonthYear);
      const target = new Date(targetMonthYear);
      const totalMonths = Math.max(1, monthsBetween(start, target));
      const elapsedMonths = relevantExpenses.length;
      const requiredPace = targetAmount / totalMonths;

      monthsRemaining = Math.max(0, totalMonths - elapsedMonths);

      if (averageMonthlyContribution > 0 && remainingAmount > 0) {
        const monthsToComplete = Math.ceil(remainingAmount / averageMonthlyContribution);
        const today = new Date();
        const completion = new Date(today.getFullYear(), today.getMonth() + monthsToComplete, 1);
        estimatedCompletionMonth = completion.toISOString().substring(0, 7); // YYYY-MM
      }

      // Determine if on track
      const expectedContribution = elapsedMonths * requiredPace;
      const ratio = totalContribution / Math.max(1, expectedContribution);

      if (ratio >= 0.95) {
        onTrack = true;
        paceStatus = 'on_track';
      } else if (ratio >= 0.75) {
        onTrack = false;
        paceStatus = 'slightly_behind';
      } else {
        onTrack = false;
        paceStatus = 'at_risk';
      }
    }
  }

  // Progress tracking for monthly target goals
  let meetsMonthlyTarget = null;
  let monthlyTargetDelta = null;

  if (monthlyTargetAmount !== null && monthlyTargetAmount > 0) {
    meetsMonthlyTarget = lastContribution >= monthlyTargetAmount;
    monthlyTargetDelta = lastContribution - monthlyTargetAmount;

    if (meetsMonthlyTarget) {
      paceStatus = 'on_track';
      onTrack = true;
    } else if (lastContribution >= monthlyTargetAmount * 0.75) {
      paceStatus = 'slightly_behind';
      onTrack = false;
    } else {
      paceStatus = 'at_risk';
      onTrack = false;
    }
  }

  return {
    totalContribution,
    averageMonthlyContribution,
    lastContribution,
    progressPercent,
    remainingAmount,
    monthsRemaining,
    estimatedCompletionMonth,
    onTrack,
    paceStatus,
    meetsMonthlyTarget,
    monthlyTargetDelta,
  };
};

/**
 * Get the primary goal (first active goal, or first goal if none are active).
 * 
 * @param {Array} goalsWithProgress - Goals enriched with progress data
 * @returns {Object|null} The primary goal or null
 */
const getPrimaryGoal = (goalsWithProgress) => {
  if (!goalsWithProgress || goalsWithProgress.length === 0) return null;

  const activeGoals = goalsWithProgress.filter((g) => g.status === 'active');
  if (activeGoals.length > 0) return activeGoals[0];

  return goalsWithProgress[0];
};

/**
 * Calculate number of months between two dates.
 * 
 * @param {Date} start 
 * @param {Date} end 
 * @returns {number} Number of months
 */
const monthsBetween = (start, end) => {
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  return yearDiff * 12 + monthDiff + 1; // +1 to include both start and end months
};

module.exports = {
  computeGoalProgressForUser,
  computeSingleGoalProgress,
  getPrimaryGoal,
};
