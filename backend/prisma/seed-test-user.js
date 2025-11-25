/**
 * Seed script to create a realistic test user with 7 months of financial data
 * 
 * User: Alex Taylor
 * Email: alex.taylor@email.com
 * Password: Test2026#
 * 
 * Story: Alex is a 29-year-old marketing specialist living in a high-cost urban area.
 * Income is decent ($5,800/mo) but rent and living costs are high ($2,100+).
 * The last few months have been rough, leading to accumulated debt.
 * 
 * May 2025: ❌ BAD - Moving costs & Security deposit. (Deficit: -$850)
 * June 2025: ❌ BAD - Medical emergency. (Deficit: -$400)
 * July 2025: ❌ BAD - Car breakdown. (Deficit: -$150)
 * August 2025: ⚠️ Recovery - Tight budget, barely saving.
 * September 2025: 📊 Average - Stabilizing.
 * October 2025: ✅ Good - Disciplined spending.
 * November 2025: 📉 Below Average - Holiday shopping started, slipped a bit.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test user seed...\n');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'alex.taylor@email.com' }
  });

  if (existingUser) {
    console.log('⚠️  User alex.taylor@email.com already exists. Deleting and recreating...');
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // Also check if phone number is in use by another user and clean up
  const existingPhone = await prisma.user.findUnique({
    where: { phone: '+15559876543' }
  });
  if (existingPhone) {
    console.log('⚠️  Phone number already in use, deleting conflicting user...');
    await prisma.user.delete({ where: { id: existingPhone.id } });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('Test2026#', 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: 'alex.taylor@email.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Taylor',
      phone: '+15559876543',
      createdAt: new Date('2025-05-01T10:00:00Z'),
    }
  });

  console.log('✅ Created user:', user.email);

  // Create user profile
  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id,
      householdSize: 1,
      numAdults: 1,
      numChildren: 0,
      locationType: 'urban',
      lifeStage: 'young_professional',
      employmentStatus: 'full_time',
      monthlyHouseholdIncome: 5800,
      incomeStability: 'stable',
      creditScore: 685, // Dropped due to high utilization
      totalDebt: 22000, // Increased debt from bad months
      monthlyDebtPayments: 650,
      rentOrMortgage: 2100,
      savingsGoalMonthly: 1000,
      hasHealthInsurance: true,
      financialGoalType: 'debt_payoff', // Changed to debt payoff given the situation
      emergencyFundMonths: 0.5, // Depleted
      savingsRatePercentage: 5.2, // Low average
      debtToIncomeRatio: 11.2,
      housingCostRatio: 36.2,
      monthlySavingsActual: 200,
      financialHealthScore: 48, // Low score
      optimizationPriority: 'critical',
    }
  });

  console.log('✅ Created user profile');

  // Monthly income
  const monthlyIncome = 5800;

  // ============================================
  // EXPENSE DATA: May 2025 - November 2025
  // ============================================

  const expensesData = [
    // MAY 2025: BAD - Moving costs (Deficit -$850)
    // Total: $6650
    {
      monthYear: new Date('2025-05-01'),
      housingUtilities: 2100,
      groceries: 450,
      restaurantsCafes: 550, // Eating out while moving
      transportationFuel: 200,
      publicTransport: 60,
      healthcarePharmacy: 40,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 150,
      entertainmentHobbies: 100,
      subscriptions: 45,
      otherShopping: 2500, // Furniture, Deposit, Moving supplies
      giftsCharity: 0,
      miscellaneous: 455,
    },
    // JUNE 2025: BAD - Medical emergency (Deficit -$400)
    // Total: $6200
    {
      monthYear: new Date('2025-06-01'),
      housingUtilities: 2100,
      groceries: 400,
      restaurantsCafes: 300,
      transportationFuel: 180,
      publicTransport: 60,
      healthcarePharmacy: 2800, // Emergency Bill
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 50,
      entertainmentHobbies: 50,
      subscriptions: 45,
      otherShopping: 50,
      giftsCharity: 0,
      miscellaneous: 165,
    },
    // JULY 2025: BAD - Car breakdown (Deficit -$150)
    // Total: $5950
    {
      monthYear: new Date('2025-07-01'),
      housingUtilities: 2100,
      groceries: 420,
      restaurantsCafes: 250,
      transportationFuel: 180,
      publicTransport: 60,
      healthcarePharmacy: 40,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 80,
      entertainmentHobbies: 80,
      subscriptions: 45,
      otherShopping: 100,
      giftsCharity: 0,
      miscellaneous: 2595, // Car Repair + Towing
    },
    // AUGUST 2025: Recovery - Tight budget
    // Total: $5200 (Savings $600)
    {
      monthYear: new Date('2025-08-01'),
      housingUtilities: 2150, // AC high
      groceries: 400, // Skimping on food
      restaurantsCafes: 150, // Cut back
      transportationFuel: 180,
      publicTransport: 60,
      healthcarePharmacy: 40,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 50,
      entertainmentHobbies: 50, // No fun
      subscriptions: 45,
      otherShopping: 50,
      giftsCharity: 0,
      miscellaneous: 2025, // Paying off some credit card debt immediately
    },
    // SEPTEMBER 2025: Average - Stabilizing
    // Total: $4800 (Savings $1000)
    {
      monthYear: new Date('2025-09-01'),
      housingUtilities: 2100,
      groceries: 450,
      restaurantsCafes: 250,
      transportationFuel: 180,
      publicTransport: 60,
      healthcarePharmacy: 40,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 100,
      entertainmentHobbies: 150,
      subscriptions: 45,
      otherShopping: 100,
      giftsCharity: 50,
      miscellaneous: 1275, // Debt payment
    },
    // OCTOBER 2025: Good - Disciplined
    // Total: $4300 (Savings $1500)
    {
      monthYear: new Date('2025-10-01'),
      housingUtilities: 2100,
      groceries: 450,
      restaurantsCafes: 200,
      transportationFuel: 170,
      publicTransport: 60,
      healthcarePharmacy: 30,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 80,
      entertainmentHobbies: 120,
      subscriptions: 45,
      otherShopping: 80,
      giftsCharity: 50,
      miscellaneous: 915, // Debt payment
    },
    // NOVEMBER 2025: Below Average - Holiday prep
    // Total: $5400 (Savings $400) - Low savings
    {
      monthYear: new Date('2025-11-01'),
      housingUtilities: 2100,
      groceries: 550, // Hosting
      restaurantsCafes: 450, // Socializing
      transportationFuel: 200,
      publicTransport: 70,
      healthcarePharmacy: 50,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 200, // Winter clothes
      entertainmentHobbies: 250, // Events
      subscriptions: 45,
      otherShopping: 800, // Gifts / Black Friday
      giftsCharity: 150,
      miscellaneous: 535,
    },
  ];

  // Essential categories for calculation
  const essentialCategories = [
    'housingUtilities', 'groceries', 'transportationFuel', 'publicTransport',
    'healthcarePharmacy', 'educationTuition', 'childcare'
  ];

  // Discretionary categories
  const discretionaryCategories = [
    'restaurantsCafes', 'clothingPersonalCare', 'entertainmentHobbies',
    'subscriptions', 'otherShopping', 'giftsCharity', 'miscellaneous'
  ];

  // Category display names for highest spending
  const categoryNames = {
    housingUtilities: 'Housing & Utilities',
    groceries: 'Groceries',
    restaurantsCafes: 'Restaurants & Cafes',
    transportationFuel: 'Transportation & Fuel',
    publicTransport: 'Public Transport',
    healthcarePharmacy: 'Healthcare & Pharmacy',
    educationTuition: 'Education & Tuition',
    childcare: 'Childcare',
    clothingPersonalCare: 'Clothing & Personal Care',
    entertainmentHobbies: 'Entertainment & Hobbies',
    subscriptions: 'Subscriptions',
    otherShopping: 'Other Shopping',
    giftsCharity: 'Gifts & Charity',
    miscellaneous: 'Miscellaneous'
  };

  let previousMonthExpenses = null;

  for (const expenseData of expensesData) {
    // Calculate totals
    const allCategories = [...essentialCategories, ...discretionaryCategories];
    const totalExpenses = allCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const totalEssential = essentialCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const totalDiscretionary = discretionaryCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);

    // Find highest spending category
    let highestCategory = 'housingUtilities';
    let highestAmount = 0;
    for (const cat of allCategories) {
      if ((expenseData[cat] || 0) > highestAmount) {
        highestAmount = expenseData[cat] || 0;
        highestCategory = cat;
      }
    }

    // Calculate ratios
    const essentialRatio = totalExpenses > 0 ? (totalEssential / totalExpenses) * 100 : 0;
    const discretionaryRatio = totalExpenses > 0 ? (totalDiscretionary / totalExpenses) * 100 : 0;
    const savingsThisMonth = monthlyIncome - totalExpenses;

    // Calculate spending vs last month
    let spendingVsLastMonth = null;
    if (previousMonthExpenses !== null) {
      spendingVsLastMonth = ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
    }

    // Check 50/30/20 rule
    const essentialPercent = (totalEssential / monthlyIncome) * 100;
    const discretionaryPercent = (totalDiscretionary / monthlyIncome) * 100;
    const savingsPercent = (savingsThisMonth / monthlyIncome) * 100;
    const meets50_30_20 = essentialPercent <= 50 && discretionaryPercent <= 30 && savingsPercent >= 20;

    const expense = await prisma.monthlyExpense.create({
      data: {
        userId: user.id,
        monthYear: expenseData.monthYear,
        housingUtilities: expenseData.housingUtilities,
        groceries: expenseData.groceries,
        restaurantsCafes: expenseData.restaurantsCafes,
        transportationFuel: expenseData.transportationFuel,
        publicTransport: expenseData.publicTransport,
        healthcarePharmacy: expenseData.healthcarePharmacy,
        educationTuition: expenseData.educationTuition,
        childcare: expenseData.childcare,
        clothingPersonalCare: expenseData.clothingPersonalCare,
        entertainmentHobbies: expenseData.entertainmentHobbies,
        subscriptions: expenseData.subscriptions,
        otherShopping: expenseData.otherShopping,
        giftsCharity: expenseData.giftsCharity,
        miscellaneous: expenseData.miscellaneous,
        totalExpenses,
        totalEssentialSpending: totalEssential,
        totalDiscretionarySpending: totalDiscretionary,
        essentialSpendingRatio: essentialRatio,
        discretionarySpendingRatio: discretionaryRatio,
        savingsThisMonth,
        spendingVsLastMonthPercentage: spendingVsLastMonth,
        highestSpendingCategory: categoryNames[highestCategory],
        meets50_30_20Rule: meets50_30_20,
      }
    });

    const monthName = expenseData.monthYear.toLocaleString('default', { month: 'long', year: 'numeric' });
    console.log(`✅ Created expenses for ${monthName}: $${totalExpenses.toFixed(2)} spent, $${savingsThisMonth.toFixed(2)} saved`);

    previousMonthExpenses = totalExpenses;
  }

  // ============================================
  // GOALS
  // ============================================

  // Goal 1: Total Amount Goal - Debt Payoff (started Sep 2025)
  // Target: Pay off $5,000 of credit card debt
  // Progress:
  // Sep: $1000 allocated
  // Oct: $1500 allocated
  // Nov: $400 allocated
  // Total: $2900. Target $5000. Progress ~58%.
  const totalGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Credit Card Payoff',
      type: 'total',
      targetAmount: 5000,
      monthlyTargetAmount: null,
      startMonthYear: '2025-09',
      targetMonthYear: '2026-03',
      status: 'active',
      createdAt: new Date('2025-09-01T10:00:00Z'),
    }
  });

  console.log('✅ Created goal: Credit Card Payoff (Total Amount Goal - $5,000 target)');

  // Goal 2: Monthly Savings Goal - started Oct 2025
  // Target: Save $1,000 per month consistently
  // Nov savings: $400. Failed this month.
  const monthlyGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Monthly Savings Target',
      type: 'monthly',
      targetAmount: null,
      monthlyTargetAmount: 1000,
      startMonthYear: '2025-10',
      targetMonthYear: null,
      status: 'active',
      createdAt: new Date('2025-10-01T10:00:00Z'),
    }
  });

  console.log('✅ Created goal: Monthly Savings Target ($1,000/month)');

  // ============================================
  // BUDGETS (for current and recent months)
  // ============================================

  // Budgets for ALL categories
  const budgetCategories = [
    { category: 'housingUtilities', amount: 2100 },
    { category: 'groceries', amount: 450 },
    { category: 'restaurantsCafes', amount: 250 },
    { category: 'transportationFuel', amount: 180 },
    { category: 'publicTransport', amount: 60 },
    { category: 'healthcarePharmacy', amount: 50 },
    { category: 'educationTuition', amount: 0 },
    { category: 'childcare', amount: 0 },
    { category: 'clothingPersonalCare', amount: 100 },
    { category: 'entertainmentHobbies', amount: 150 },
    { category: 'subscriptions', amount: 50 },
    { category: 'otherShopping', amount: 100 },
    { category: 'giftsCharity', amount: 50 },
    { category: 'miscellaneous', amount: 100 },
  ];

  // Create budgets for October and November 2025
  const budgetMonths = [
    new Date('2025-10-01'),
    new Date('2025-11-01'),
  ];

  for (const monthDate of budgetMonths) {
    // Get the expense record for this month to set actual spending
    const expenseRecord = await prisma.monthlyExpense.findUnique({
      where: {
        userId_monthYear: {
          userId: user.id,
          monthYear: monthDate,
        }
      }
    });

    for (const budget of budgetCategories) {
      const actualSpending = expenseRecord ? (expenseRecord[budget.category] || 0) : 0;
      
      await prisma.budget.create({
        data: {
          userId: user.id,
          monthYear: monthDate,
          category: budget.category,
          budgetedAmount: budget.amount,
          actualSpending: actualSpending,
        }
      });
    }

    const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    console.log(`✅ Created ${budgetCategories.length} budgets for ${monthName}`);
  }

  // ============================================
  // FINANCIAL HEALTH RECORDS
  // ============================================

  const healthRecords = [
    // May 2025 - Bad
    {
      monthYear: new Date('2025-05-01'),
      financialStressLevel: 8,
      financialHealthScore: 40,
      optimizationPriority: 'critical',
      needsEmergencyFund: true,
      overspendingRestaurants: true,
      overspendingEntertainment: false,
      overspendingSubscriptions: false,
      highDebtBurden: true,
      insufficientSavings: true,
      housingCostTooHigh: true,
      lifestyleInflationDetected: false,
      irregularSavingsPattern: true,
      hasAdequateEmergencyFund: false,
      healthySavingsRate: false,
      controlledDiscretionarySpending: false,
      lowDebtBurden: false,
      overallFinancialHealth: 'vulnerable',
      needsOptimization: true,
      optimizationUrgency: 9,
      top3ProblemAreas: JSON.stringify(['Negative savings', 'High moving costs', 'Debt increasing']),
    },
    // June 2025 - Bad
    {
      monthYear: new Date('2025-06-01'),
      financialStressLevel: 9,
      financialHealthScore: 35,
      optimizationPriority: 'critical',
      needsEmergencyFund: true,
      overspendingRestaurants: false,
      overspendingEntertainment: false,
      overspendingSubscriptions: false,
      highDebtBurden: true,
      insufficientSavings: true,
      housingCostTooHigh: true,
      lifestyleInflationDetected: false,
      irregularSavingsPattern: true,
      hasAdequateEmergencyFund: false,
      healthySavingsRate: false,
      controlledDiscretionarySpending: false,
      lowDebtBurden: false,
      overallFinancialHealth: 'critical',
      needsOptimization: true,
      optimizationUrgency: 10,
      top3ProblemAreas: JSON.stringify(['Medical debt', 'Negative savings', 'High stress']),
    },
    // July 2025 - Bad
    {
      monthYear: new Date('2025-07-01'),
      financialStressLevel: 8,
      financialHealthScore: 38,
      optimizationPriority: 'critical',
      needsEmergencyFund: true,
      overspendingRestaurants: false,
      overspendingEntertainment: false,
      overspendingSubscriptions: false,
      highDebtBurden: true,
      insufficientSavings: true,
      housingCostTooHigh: true,
      lifestyleInflationDetected: false,
      irregularSavingsPattern: true,
      hasAdequateEmergencyFund: false,
      healthySavingsRate: false,
      controlledDiscretionarySpending: false,
      lowDebtBurden: false,
      overallFinancialHealth: 'vulnerable',
      needsOptimization: true,
      optimizationUrgency: 9,
      top3ProblemAreas: JSON.stringify(['Car repair costs', 'Debt accumulation', 'No emergency fund']),
    },
    // August 2025 - Recovery
    {
      monthYear: new Date('2025-08-01'),
      financialStressLevel: 6,
      financialHealthScore: 50,
      optimizationPriority: 'high',
      needsEmergencyFund: true,
      overspendingRestaurants: false,
      overspendingEntertainment: false,
      overspendingSubscriptions: false,
      highDebtBurden: true,
      insufficientSavings: true,
      housingCostTooHigh: true,
      lifestyleInflationDetected: false,
      irregularSavingsPattern: false,
      hasAdequateEmergencyFund: false,
      healthySavingsRate: false,
      controlledDiscretionarySpending: true,
      lowDebtBurden: false,
      overallFinancialHealth: 'needs_improvement',
      needsOptimization: true,
      optimizationUrgency: 7,
      top3ProblemAreas: JSON.stringify(['High debt', 'Low savings', 'Housing cost']),
    },
    // September 2025 - Average
    {
      monthYear: new Date('2025-09-01'),
      financialStressLevel: 5,
      financialHealthScore: 55,
      optimizationPriority: 'medium',
      needsEmergencyFund: true,
      overspendingRestaurants: false,
      overspendingEntertainment: false,
      overspendingSubscriptions: false,
      highDebtBurden: true,
      insufficientSavings: true,
      housingCostTooHigh: true,
      lifestyleInflationDetected: false,
      irregularSavingsPattern: false,
      hasAdequateEmergencyFund: false,
      healthySavingsRate: true,
      controlledDiscretionarySpending: true,
      lowDebtBurden: false,
      overallFinancialHealth: 'fair',
      needsOptimization: true,
      optimizationUrgency: 5,
      top3ProblemAreas: JSON.stringify(['Debt repayment priority', 'Building savings', 'Housing cost']),
    },
    // October 2025 - Good
    {
      monthYear: new Date('2025-10-01'),
      financialStressLevel: 4,
      financialHealthScore: 65,
      optimizationPriority: 'medium',
      needsEmergencyFund: true,
      overspendingRestaurants: false,
      overspendingEntertainment: false,
      overspendingSubscriptions: false,
      highDebtBurden: true,
      insufficientSavings: false,
      housingCostTooHigh: true,
      lifestyleInflationDetected: false,
      irregularSavingsPattern: false,
      hasAdequateEmergencyFund: false,
      healthySavingsRate: true,
      controlledDiscretionarySpending: true,
      lowDebtBurden: false,
      overallFinancialHealth: 'fair',
      needsOptimization: true,
      optimizationUrgency: 4,
      top3ProblemAreas: JSON.stringify(['Debt still high', 'Emergency fund growing', 'Housing cost']),
    },
    // November 2025 - Below Average
    {
      monthYear: new Date('2025-11-01'),
      financialStressLevel: 6,
      financialHealthScore: 52,
      optimizationPriority: 'high',
      needsEmergencyFund: true,
      overspendingRestaurants: true,
      overspendingEntertainment: true,
      overspendingSubscriptions: false,
      highDebtBurden: true,
      insufficientSavings: true,
      housingCostTooHigh: true,
      lifestyleInflationDetected: true,
      irregularSavingsPattern: true,
      hasAdequateEmergencyFund: false,
      healthySavingsRate: false,
      controlledDiscretionarySpending: false,
      lowDebtBurden: false,
      overallFinancialHealth: 'needs_improvement',
      needsOptimization: true,
      optimizationUrgency: 6,
      top3ProblemAreas: JSON.stringify(['Holiday overspending', 'Low savings rate', 'Debt burden']),
    },
  ];

  for (const healthData of healthRecords) {
    await prisma.financialHealth.create({
      data: {
        userId: user.id,
        ...healthData,
      }
    });
    const monthName = healthData.monthYear.toLocaleString('default', { month: 'long', year: 'numeric' });
    console.log(`✅ Created financial health record for ${monthName} (Score: ${healthData.financialHealthScore})`);
  }

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TEST USER CREATED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📧 Email:    alex.taylor@email.com');
  console.log('🔑 Password: Test2026#');
  console.log('\n📊 Data Summary:');
  console.log('   • User Profile: Complete (Urban, High Debt)');
  console.log('   • Expense Records: 7 months (May - November 2025)');
  console.log('   • Financial Health Records: 7 months');
  console.log('   • Goals: 2 (Debt Payoff + Monthly Savings)');
  console.log('   • Budgets: 28 (14 categories × 2 months)');
  console.log('\n📈 Financial Journey:');
  console.log('   May 2025:  ❌ BAD - Moving costs (Deficit -$850)');
  console.log('   June 2025: ❌ BAD - Medical emergency (Deficit -$400)');
  console.log('   July 2025: ❌ BAD - Car breakdown (Deficit -$150)');
  console.log('   Aug 2025:  ⚠️  Recovery - Tight budget');
  console.log('   Sep 2025:  📊 Average - Stabilizing');
  console.log('   Oct 2025:  ✅ GOOD - Disciplined');
  console.log('   Nov 2025:  📉 Below Average - Holiday overspending');
  console.log('\n🎯 Active Goals:');
  console.log('   1. Credit Card Payoff: $5,000 target - In Progress (~58%)');
  console.log('   2. Monthly Savings: $1,000/month - Missed in Nov');
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
