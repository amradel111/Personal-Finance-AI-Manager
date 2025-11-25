/**
 * Seed script for Test User 2: Sarah Jenkins
 * 
 * Story: Sarah is a graphic designer with a moderate income ($4,200/mo).
 * She generally manages money well but had a rough summer (Vacation + Car issues).
 * She is now back on track but November was a bit loose with spending.
 * 
 * Features:
 * - Mixed history (Good Spring, Bad Summer, Good Fall, Moderate Current)
 * - FULL BUDGETS for ALL categories across ALL months.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test user 2 seed (Sarah Jenkins)...\n');

  const email = 'sarah.jenkins@email.com';
  const password = 'Test2026#';
  const phone = '+15551112233';

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
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone,
      createdAt: new Date('2025-05-01T10:00:00Z'),
    }
  });
  console.log('✅ Created user:', user.email);

  // 3. Create Profile
  const monthlyIncome = 4200;
  await prisma.userProfile.create({
    data: {
      userId: user.id,
      householdSize: 1,
      numAdults: 1,
      numChildren: 0,
      locationType: 'suburban',
      lifeStage: 'early_career',
      employmentStatus: 'full_time',
      monthlyHouseholdIncome: monthlyIncome,
      incomeStability: 'stable',
      creditScore: 720,
      totalDebt: 5000, // Car loan mostly
      monthlyDebtPayments: 300,
      rentOrMortgage: 1500,
      savingsGoalMonthly: 500,
      hasHealthInsurance: true,
      financialGoalType: 'savings',
      emergencyFundMonths: 2,
      savingsRatePercentage: 10,
      debtToIncomeRatio: 7,
      housingCostRatio: 35.7,
      monthlySavingsActual: 400,
      financialHealthScore: 72,
      optimizationPriority: 'medium',
    }
  });
  console.log('✅ Created user profile');

  // 4. Expenses Data (May - Nov 2025)
  const expensesData = [
    // MAY: Good (Saved $700)
    {
      monthYear: new Date('2025-05-01'),
      housingUtilities: 1500, groceries: 350, restaurantsCafes: 200, transportationFuel: 150,
      publicTransport: 0, healthcarePharmacy: 50, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 100, entertainmentHobbies: 100, subscriptions: 30, otherShopping: 100,
      giftsCharity: 50, miscellaneous: 870, // Total ~3500
    },
    // JUNE: Good (Saved $600)
    {
      monthYear: new Date('2025-06-01'),
      housingUtilities: 1500, groceries: 380, restaurantsCafes: 250, transportationFuel: 160,
      publicTransport: 0, healthcarePharmacy: 30, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 150, entertainmentHobbies: 120, subscriptions: 30, otherShopping: 150,
      giftsCharity: 50, miscellaneous: 780, // Total ~3600
    },
    // JULY: BAD - Vacation (Deficit -$600) -> Total 4800
    {
      monthYear: new Date('2025-07-01'),
      housingUtilities: 1500, groceries: 300, restaurantsCafes: 600, transportationFuel: 150,
      publicTransport: 100, healthcarePharmacy: 30, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 200, entertainmentHobbies: 400, subscriptions: 30, otherShopping: 300,
      giftsCharity: 0, miscellaneous: 1190, // Travel costs
    },
    // AUGUST: BAD - Car Repair (Deficit -$300) -> Total 4500
    {
      monthYear: new Date('2025-08-01'),
      housingUtilities: 1550, groceries: 350, restaurantsCafes: 150, transportationFuel: 150,
      publicTransport: 0, healthcarePharmacy: 40, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 50, entertainmentHobbies: 50, subscriptions: 30, otherShopping: 50,
      giftsCharity: 0, miscellaneous: 2080, // Car repair bill
    },
    // SEPTEMBER: Good - Recovery (Saved $800) -> Total 3400
    {
      monthYear: new Date('2025-09-01'),
      housingUtilities: 1500, groceries: 320, restaurantsCafes: 100, transportationFuel: 140,
      publicTransport: 0, healthcarePharmacy: 30, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 50, entertainmentHobbies: 50, subscriptions: 30, otherShopping: 50,
      giftsCharity: 0, miscellaneous: 1130,
    },
    // OCTOBER: Good (Saved $700) -> Total 3500
    {
      monthYear: new Date('2025-10-01'),
      housingUtilities: 1500, groceries: 350, restaurantsCafes: 200, transportationFuel: 150,
      publicTransport: 0, healthcarePharmacy: 50, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 100, entertainmentHobbies: 100, subscriptions: 30, otherShopping: 100,
      giftsCharity: 50, miscellaneous: 870,
    },
    // NOVEMBER: Moderate (Saved $200) -> Total 4000
    {
      monthYear: new Date('2025-11-01'),
      housingUtilities: 1500, groceries: 450, restaurantsCafes: 350, transportationFuel: 180,
      publicTransport: 0, healthcarePharmacy: 50, educationTuition: 0, childcare: 0,
      clothingPersonalCare: 200, entertainmentHobbies: 200, subscriptions: 30, otherShopping: 400,
      giftsCharity: 100, miscellaneous: 540,
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

  // 5. Create Expenses & Budgets
  // We define a "Standard Budget" that she tries to stick to
  const standardBudget = {
    housingUtilities: 1500, groceries: 400, restaurantsCafes: 250, transportationFuel: 150,
    publicTransport: 50, healthcarePharmacy: 100, educationTuition: 0, childcare: 0,
    clothingPersonalCare: 150, entertainmentHobbies: 150, subscriptions: 30, otherShopping: 200,
    giftsCharity: 100, miscellaneous: 500
  };

  for (const expenseData of expensesData) {
    // --- Create Expense Record ---
    const allCats = [...essentialCategories, ...discretionaryCategories];
    const totalExpenses = allCats.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const totalEssential = essentialCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const totalDiscretionary = discretionaryCategories.reduce((sum, cat) => sum + (expenseData[cat] || 0), 0);
    const savingsThisMonth = monthlyIncome - totalExpenses;

    // Find highest category
    let highestCategory = 'housingUtilities';
    let highestAmount = 0;
    for (const cat of allCats) {
      if ((expenseData[cat] || 0) > highestAmount) {
        highestAmount = expenseData[cat] || 0;
        highestCategory = cat;
      }
    }

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
        spendingVsLastMonthPercentage: 0, // Simplified
        highestSpendingCategory: categoryNames[highestCategory],
        meets50_30_20Rule: (totalEssential/monthlyIncome*100 <= 50) && (totalDiscretionary/monthlyIncome*100 <= 30) && (savingsThisMonth/monthlyIncome*100 >= 20),
      }
    });

    // --- Create Budget Records (ALL Categories for THIS month) ---
    for (const cat of allCats) {
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
    
    const mName = expenseData.monthYear.toLocaleString('default', { month: 'short' });
    console.log(`✅ ${mName}: Exp $${totalExpenses} | Budgets Created`);
  }

  // 6. Goals
  await prisma.goal.create({
    data: {
      userId: user.id,
      name: 'Summer Vacation 2026',
      type: 'total',
      targetAmount: 3000,
      startMonthYear: '2025-09',
      targetMonthYear: '2026-05',
      status: 'active',
      createdAt: new Date('2025-09-01'),
    }
  });
  console.log('✅ Created Goal: Summer Vacation');

  // 7. Health Records (Simplified generation)
  const healthScores = [75, 78, 55, 50, 65, 75, 70]; // May -> Nov
  let i = 0;
  for (const expenseData of expensesData) {
    await prisma.financialHealth.create({
      data: {
        userId: user.id,
        monthYear: expenseData.monthYear,
        financialHealthScore: healthScores[i],
        financialStressLevel: healthScores[i] < 60 ? 7 : 3,
        optimizationPriority: healthScores[i] < 60 ? 'high' : 'low',
        needsEmergencyFund: false,
        overspendingRestaurants: false,
        overspendingEntertainment: false,
        overspendingSubscriptions: false,
        highDebtBurden: false,
        insufficientSavings: healthScores[i] < 60,
        housingCostTooHigh: false,
        lifestyleInflationDetected: false,
        irregularSavingsPattern: false,
        hasAdequateEmergencyFund: true,
        healthySavingsRate: healthScores[i] > 70,
        controlledDiscretionarySpending: true,
        lowDebtBurden: true,
        overallFinancialHealth: healthScores[i] > 70 ? 'healthy' : (healthScores[i] > 50 ? 'fair' : 'vulnerable'),
        needsOptimization: healthScores[i] < 70,
        optimizationUrgency: healthScores[i] < 60 ? 8 : 4,
        top3ProblemAreas: JSON.stringify([]),
      }
    });
    i++;
  }
  console.log('✅ Created Health Records');

  console.log('\n' + '='.repeat(50));
  console.log('🎉 USER CREATED: Sarah Jenkins');
  console.log('📧 Email: sarah.jenkins@email.com');
  console.log('🔑 Pass:  Test2026#');
  console.log('='.repeat(50));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
