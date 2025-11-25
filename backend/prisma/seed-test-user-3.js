/**
 * Seed script for Test User 3: Jordan Mitchell
 * 
 * Story: Jordan is a 35-year-old teacher with steady income ($3,800/mo).
 * Generally disciplined, occasional splurges. 
 * Mix of good and okay months, nothing too dramatic.
 * 
 * Features:
 * - FULL BUDGETS for ALL 14 categories for ALL 7 months
 * - Moderate financial profile
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test user 3 seed (Jordan Mitchell)...\n');

  const email = 'jordan.mitchell@email.com';
  const password = 'Test2026#';
  const phone = '+15554445566';

  // 1. Cleanup existing user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`⚠️  User ${email} already exists. Deleting...`);
    await prisma.user.delete({ where: { id: existingUser.id } });
  }
  
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    console.log(`⚠️  Phone ${phone} in use. Deleting...`);
    await prisma.user.delete({ where: { id: existingPhone.id } });
  }

  // 2. Create User
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Jordan',
      lastName: 'Mitchell',
      phone,
      createdAt: new Date('2025-05-01T10:00:00Z'),
    }
  });
  console.log('✅ Created user:', user.email);

  // 3. Create Profile
  const monthlyIncome = 3800;
  await prisma.userProfile.create({
    data: {
      userId: user.id,
      householdSize: 2,
      numAdults: 2,
      numChildren: 0,
      locationType: 'suburban',
      lifeStage: 'established',
      employmentStatus: 'full_time',
      monthlyHouseholdIncome: monthlyIncome,
      incomeStability: 'stable',
      creditScore: 750,
      totalDebt: 8000,
      monthlyDebtPayments: 250,
      rentOrMortgage: 1200,
      savingsGoalMonthly: 400,
      hasHealthInsurance: true,
      financialGoalType: 'savings',
      emergencyFundMonths: 3,
      savingsRatePercentage: 12,
      debtToIncomeRatio: 6.5,
      housingCostRatio: 31.6,
      monthlySavingsActual: 350,
      financialHealthScore: 75,
      optimizationPriority: 'low',
    }
  });
  console.log('✅ Created user profile');

  // 4. Expenses Data (May - Nov 2025)
  // Income: $3800/mo
  const expensesData = [
    // MAY: Good (Saved $500) -> Total $3300
    {
      monthYear: new Date('2025-05-01'),
      housingUtilities: 1200, groceries: 400, restaurantsCafes: 150, transportationFuel: 200,
      publicTransport: 0, healthcarePharmacy: 50, educationTuition: 100, childcare: 0,
      clothingPersonalCare: 80, entertainmentHobbies: 100, subscriptions: 40, otherShopping: 100,
      giftsCharity: 80, miscellaneous: 800,
    },
    // JUNE: Okay (Saved $300) -> Total $3500
    {
      monthYear: new Date('2025-06-01'),
      housingUtilities: 1200, groceries: 420, restaurantsCafes: 200, transportationFuel: 220,
      publicTransport: 0, healthcarePharmacy: 60, educationTuition: 100, childcare: 0,
      clothingPersonalCare: 100, entertainmentHobbies: 150, subscriptions: 40, otherShopping: 150,
      giftsCharity: 60, miscellaneous: 800,
    },
    // JULY: Bad - Summer splurge (Saved -$200) -> Total $4000
    {
      monthYear: new Date('2025-07-01'),
      housingUtilities: 1250, groceries: 450, restaurantsCafes: 350, transportationFuel: 250,
      publicTransport: 50, healthcarePharmacy: 40, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 150, entertainmentHobbies: 300, subscriptions: 40, otherShopping: 400,
      giftsCharity: 100, miscellaneous: 620,
    },
    // AUGUST: Good (Saved $600) -> Total $3200
    {
      monthYear: new Date('2025-08-01'),
      housingUtilities: 1200, groceries: 380, restaurantsCafes: 100, transportationFuel: 180,
      publicTransport: 0, healthcarePharmacy: 50, educationTuition: 100, childcare: 0,
      clothingPersonalCare: 60, entertainmentHobbies: 80, subscriptions: 40, otherShopping: 80,
      giftsCharity: 50, miscellaneous: 880,
    },
    // SEPTEMBER: Good (Saved $450) -> Total $3350
    {
      monthYear: new Date('2025-09-01'),
      housingUtilities: 1200, groceries: 400, restaurantsCafes: 150, transportationFuel: 200,
      publicTransport: 0, healthcarePharmacy: 80, educationTuition: 100, childcare: 0,
      clothingPersonalCare: 100, entertainmentHobbies: 100, subscriptions: 40, otherShopping: 100,
      giftsCharity: 80, miscellaneous: 800,
    },
    // OCTOBER: Okay (Saved $200) -> Total $3600
    {
      monthYear: new Date('2025-10-01'),
      housingUtilities: 1200, groceries: 420, restaurantsCafes: 250, transportationFuel: 200,
      publicTransport: 20, healthcarePharmacy: 100, educationTuition: 100, childcare: 0,
      clothingPersonalCare: 120, entertainmentHobbies: 150, subscriptions: 40, otherShopping: 200,
      giftsCharity: 100, miscellaneous: 700,
    },
    // NOVEMBER: Moderate (Saved $300) -> Total $3500
    {
      monthYear: new Date('2025-11-01'),
      housingUtilities: 1200, groceries: 450, restaurantsCafes: 200, transportationFuel: 200,
      publicTransport: 0, healthcarePharmacy: 50, educationTuition: 100, childcare: 0,
      clothingPersonalCare: 150, entertainmentHobbies: 150, subscriptions: 40, otherShopping: 250,
      giftsCharity: 100, miscellaneous: 610,
    },
  ];

  const categoryNames = {
    housingUtilities: 'Housing & Utilities', groceries: 'Groceries', restaurantsCafes: 'Restaurants & Cafes',
    transportationFuel: 'Transportation & Fuel', publicTransport: 'Public Transport', healthcarePharmacy: 'Healthcare & Pharmacy',
    educationTuition: 'Education & Tuition', childcare: 'Childcare', clothingPersonalCare: 'Clothing & Personal Care',
    entertainmentHobbies: 'Entertainment & Hobbies', subscriptions: 'Subscriptions', otherShopping: 'Other Shopping',
    giftsCharity: 'Gifts & Charity', miscellaneous: 'Miscellaneous'
  };

  const essentialCategories = ['housingUtilities', 'groceries', 'transportationFuel', 'publicTransport', 'healthcarePharmacy', 'educationTuition', 'childcare'];
  const discretionaryCategories = ['restaurantsCafes', 'clothingPersonalCare', 'entertainmentHobbies', 'subscriptions', 'otherShopping', 'giftsCharity', 'miscellaneous'];
  const allCategories = [...essentialCategories, ...discretionaryCategories];

  // Jordan's budget (what they try to stick to)
  const standardBudget = {
    housingUtilities: 1200, groceries: 400, restaurantsCafes: 200, transportationFuel: 200,
    publicTransport: 50, healthcarePharmacy: 80, educationTuition: 100, childcare: 0,
    clothingPersonalCare: 100, entertainmentHobbies: 120, subscriptions: 40, otherShopping: 150,
    giftsCharity: 100, miscellaneous: 600
  };

  // 5. Create Expenses & Budgets for EVERY month
  for (const expenseData of expensesData) {
    const totalExpenses = allCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const totalEssential = essentialCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const totalDiscretionary = discretionaryCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const savingsThisMonth = monthlyIncome - totalExpenses;

    let highestCategory = 'housingUtilities';
    let highestAmount = 0;
    for (const cat of allCategories) {
      if ((expenseData[cat] || 0) > highestAmount) {
        highestAmount = expenseData[cat] || 0;
        highestCategory = cat;
      }
    }

    // Create expense record
    await prisma.monthlyExpense.create({
      data: {
        userId: user.id,
        monthYear: expenseData.monthYear,
        ...expenseData,
        totalExpenses,
        totalEssentialSpending: totalEssential,
        totalDiscretionarySpending: totalDiscretionary,
        essentialSpendingRatio: (totalEssential / totalExpenses) * 100,
        discretionarySpendingRatio: (totalDiscretionary / totalExpenses) * 100,
        savingsThisMonth,
        spendingVsLastMonthPercentage: 0,
        highestSpendingCategory: categoryNames[highestCategory],
        meets50_30_20Rule: (totalEssential/monthlyIncome*100 <= 50) && (totalDiscretionary/monthlyIncome*100 <= 30) && (savingsThisMonth/monthlyIncome*100 >= 20),
      }
    });

    // *** CREATE BUDGETS FOR ALL 14 CATEGORIES FOR THIS MONTH ***
    for (const cat of allCategories) {
      await prisma.budget.create({
        data: {
          userId: user.id,
          monthYear: expenseData.monthYear,
          category: cat,
          budgetedAmount: standardBudget[cat] || 0,
          actualSpending: expenseData[cat] || 0,
        }
      });
    }
    
    const mName = expenseData.monthYear.toLocaleString('default', { month: 'short', year: 'numeric' });
    console.log(`✅ ${mName}: Expense $${totalExpenses}, Saved $${savingsThisMonth} | 14 Budgets Created`);
  }

  // 6. Goals
  await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'New Car Down Payment',
      type: 'total',
      targetAmount: 5000,
      startMonthYear: '2025-05',
      targetMonthYear: '2026-05',
      status: 'active',
      createdAt: new Date('2025-05-01'),
    }
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Monthly Savings Goal',
      type: 'monthly',
      monthlyTargetAmount: 400,
      startMonthYear: '2025-05',
      status: 'active',
      createdAt: new Date('2025-05-01'),
    }
  });
  console.log('✅ Created 2 Goals');

  // 7. Health Records
  const healthScores = [78, 72, 55, 80, 76, 68, 70];
  let i = 0;
  for (const expenseData of expensesData) {
    const score = healthScores[i];
    await prisma.financialHealth.create({
      data: {
        userId: user.id,
        monthYear: expenseData.monthYear,
        financialHealthScore: score,
        financialStressLevel: score < 60 ? 6 : 3,
        optimizationPriority: score < 60 ? 'high' : 'low',
        needsEmergencyFund: false,
        overspendingRestaurants: score < 60,
        overspendingEntertainment: score < 60,
        overspendingSubscriptions: false,
        highDebtBurden: false,
        insufficientSavings: score < 60,
        housingCostTooHigh: false,
        lifestyleInflationDetected: false,
        irregularSavingsPattern: false,
        hasAdequateEmergencyFund: true,
        healthySavingsRate: score >= 70,
        controlledDiscretionarySpending: score >= 70,
        lowDebtBurden: true,
        overallFinancialHealth: score >= 70 ? 'healthy' : (score >= 55 ? 'fair' : 'vulnerable'),
        needsOptimization: score < 75,
        optimizationUrgency: score < 60 ? 7 : 3,
        top3ProblemAreas: JSON.stringify([]),
      }
    });
    i++;
  }
  console.log('✅ Created 7 Health Records');

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('🎉 USER CREATED: Jordan Mitchell');
  console.log('='.repeat(55));
  console.log('📧 Email:    jordan.mitchell@email.com');
  console.log('🔑 Password: Test2026#');
  console.log('');
  console.log('📊 Data Created:');
  console.log('   • 7 months of expenses (May - Nov 2025)');
  console.log('   • 98 budget records (14 categories × 7 months)');
  console.log('   • 2 goals (Total + Monthly)');
  console.log('   • 7 health records');
  console.log('='.repeat(55) + '\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
