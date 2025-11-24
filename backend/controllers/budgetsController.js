const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get budgets for a specific month
exports.getBudgets = async (req, res) => {
  try {
    const { monthYear } = req.query; // Expect YYYY-MM or YYYY-MM-DD format
    const userId = req.user.id;

    if (!monthYear) {
      return res.status(400).json({ message: 'Month/Year is required' });
    }

    // Handle both YYYY-MM and YYYY-MM-DD formats
    const dateParts = monthYear.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
    const normalizedDate = new Date(year, month, 1);

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        monthYear: normalizedDate
      }
    });

    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Server error fetching budgets' });
  }
};

// Create or update a budget
exports.upsertBudget = async (req, res) => {
  try {
    const { category, amount, monthYear } = req.body;
    const userId = req.user.id;

    if (!category || amount === undefined || !monthYear) {
      return res.status(400).json({ message: 'Category, amount, and monthYear are required' });
    }

    // Handle both YYYY-MM and YYYY-MM-DD formats
    const dateParts = monthYear.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
    const normalizedDate = new Date(year, month, 1);

    // Try to fetch the MonthlyExpense to update actualSpending
    const monthlyExpense = await prisma.monthlyExpense.findUnique({
        where: {
            userId_monthYear: {
                userId: userId,
                monthYear: normalizedDate
            }
        }
    });

    let actualSpending = 0;
    if (monthlyExpense) {
        // Map category string to MonthlyExpense field
        // We assume the category string matches the field name in MonthlyExpense
        if (monthlyExpense[category] !== undefined) {
            actualSpending = monthlyExpense[category];
        }
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_monthYear_category: {
          userId,
          monthYear: normalizedDate,
          category
        }
      },
      update: {
        budgetedAmount: parseFloat(amount),
        actualSpending: actualSpending
      },
      create: {
        userId,
        monthYear: normalizedDate,
        category,
        budgetedAmount: parseFloat(amount),
        actualSpending: actualSpending
      }
    });

    res.json(budget);
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({ message: 'Server error saving budget' });
  }
};
