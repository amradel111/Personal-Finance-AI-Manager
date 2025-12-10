/**
 * ML Controller
 * Handles ML service integration for batch processing users.
 */

const prisma = require('../config/database');
const mlService = require('../utils/mlService');

/**
 * POST /api/ml/process-all-users
 * Process all users and generate AI insights for each.
 */
const processAllUsers = async (req, res) => {
    try {
        // Check if ML service is available
        const isMLAvailable = await mlService.checkMLServiceHealth();
        if (!isMLAvailable) {
            return res.status(503).json({
                error: 'ML Service unavailable',
                message: 'The ML service is not running. Start it with: python app.py'
            });
        }

        // Fetch all users with their profiles and expenses
        const users = await prisma.user.findMany({
            include: {
                profile: true,
                expenses: {
                    orderBy: { monthYear: 'asc' },
                    take: 12, // Last 12 months
                },
            },
        });

        if (!users.length) {
            return res.json({
                status: 'success',
                message: 'No users found',
                total_processed: 0,
                results: [],
            });
        }

        // Transform users data for ML service
        const usersData = users.map(user => {
            const profile = user.profile;
            const expenses = user.expenses;

            // Get historical expenses amounts
            const historicalExpenses = expenses.map(e => e.totalExpenses).filter(e => e != null);

            // Latest expense
            const latestExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;

            return {
                id: user.id,
                email: user.email,
                income: profile?.monthlyHouseholdIncome || 0,
                expenses: latestExpense?.totalExpenses || 0,
                savings: latestExpense?.savingsThisMonth || 0,
                total_debt: profile?.totalDebt || 0,
                monthly_debt_payments: profile?.monthlyDebtPayments || 0,
                savings_rate: profile?.savingsRatePercentage || 0,
                emergency_fund_months: profile?.emergencyFundMonths || 0,
                historical_expenses: historicalExpenses,
            };
        });

        // Send to ML service for batch processing
        const mlResults = await mlService.batchProcessUsers(usersData);

        if (!mlResults) {
            return res.status(500).json({
                error: 'ML processing failed',
                message: 'Failed to get results from ML service'
            });
        }

        return res.json(mlResults);

    } catch (error) {
        console.error('Error processing all users:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/ml/health
 * Check ML service health status.
 */
const checkHealth = async (req, res) => {
    try {
        const isAvailable = await mlService.checkMLServiceHealth();

        if (isAvailable) {
            // Get detailed health info
            const response = await fetch(`${mlService.ML_SERVICE_URL}/health`);
            const healthData = await response.json();
            return res.json({
                status: 'available',
                ml_service: healthData,
            });
        }

        return res.json({
            status: 'unavailable',
            message: 'ML service is not running',
        });

    } catch (error) {
        return res.json({
            status: 'unavailable',
            error: error.message,
        });
    }
};

/**
 * GET /api/ml/user-insights/:userId
 * Get AI insights for a specific user.
 * Use 'me' as userId to get insights for the authenticated user.
 */
const getUserInsights = async (req, res) => {
    try {
        let { userId } = req.params;

        // If userId is 'me', use the authenticated user's ID
        if (userId === 'me') {
            userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
        }

        // Fetch user with profile and expenses
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                expenses: {
                    orderBy: { monthYear: 'asc' },
                    take: 12,
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = user.profile;
        const expenses = user.expenses;
        const historicalExpenses = expenses.map(e => e.totalExpenses).filter(e => e != null);
        const latestExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;

        const userData = {
            income: profile?.monthlyHouseholdIncome || 0,
            expenses: latestExpense?.totalExpenses || 0,
            savings: latestExpense?.savingsThisMonth || 0,
            total_debt: profile?.totalDebt || 0,
            historical_expenses: historicalExpenses,
        };

        const insights = await mlService.getInsights(userData);

        if (!insights) {
            return res.status(503).json({
                error: 'ML Service unavailable',
                message: 'Could not generate insights. Is the ML service running?'
            });
        }

        return res.json({
            userId,
            insights,
        });

    } catch (error) {
        console.error('Error getting user insights:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/ml/process-history
 * Process all historical months for the authenticated user and save AI scores.
 * This runs AI analysis on each month's data and stores the results.
 */
const processUserHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if ML service is available
        const isMLAvailable = await mlService.checkMLServiceHealth();
        if (!isMLAvailable) {
            return res.status(503).json({
                error: 'ML Service unavailable',
                message: 'The ML service is not running. Start it with: python app.py'
            });
        }

        // Fetch user profile and all expenses
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                expenses: {
                    orderBy: { monthYear: 'asc' },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = user.profile;
        const allExpenses = user.expenses;

        if (!allExpenses.length) {
            return res.json({
                status: 'success',
                message: 'No expense records to process',
                processed: 0,
            });
        }

        const results = [];
        const income = profile?.monthlyHouseholdIncome || 0;
        const totalDebt = profile?.totalDebt || 0;

        // Process each month
        for (let i = 0; i < allExpenses.length; i++) {
            const expense = allExpenses[i];

            // Get historical expenses up to this point
            const historicalExpenses = allExpenses
                .slice(0, i + 1)
                .map(e => e.totalExpenses)
                .filter(e => e != null);

            const userData = {
                income,
                expenses: expense.totalExpenses || 0,
                savings: expense.savingsThisMonth || 0,
                total_debt: totalDebt,
                historical_expenses: historicalExpenses,
            };

            try {
                const insights = await mlService.getInsights(userData);

                if (insights && insights.health) {
                    // Update the expense record with AI scores
                    await prisma.monthlyExpense.update({
                        where: { id: expense.id },
                        data: {
                            aiHealthScore: insights.health.score,
                            aiHealthCategory: insights.health.category,
                            aiForecastNextMonth: insights.forecast?.next_month || null,
                            aiForecastTrend: insights.forecast?.trend || null,
                            aiProcessedAt: new Date(),
                        },
                    });

                    results.push({
                        monthYear: expense.monthYear,
                        status: 'success',
                        aiHealthScore: insights.health.score,
                        aiHealthCategory: insights.health.category,
                    });
                } else {
                    results.push({
                        monthYear: expense.monthYear,
                        status: 'error',
                        error: 'No insights returned',
                    });
                }
            } catch (err) {
                results.push({
                    monthYear: expense.monthYear,
                    status: 'error',
                    error: err.message,
                });
            }
        }

        const successful = results.filter(r => r.status === 'success').length;

        return res.json({
            status: 'success',
            message: `Processed ${successful} of ${allExpenses.length} months`,
            processed: successful,
            total: allExpenses.length,
            results,
        });

    } catch (error) {
        console.error('Error processing user history:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    processAllUsers,
    checkHealth,
    getUserInsights,
    processUserHistory,
};
