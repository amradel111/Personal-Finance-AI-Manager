const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test account credentials
const TEST_USER = {
  email: 'testuser@finance.com',
  password: 'Test@2024!',
  firstName: 'Sarah',
  lastName: 'TestUser',
  phone: '+1987654321'
};

// Profile data - realistic scenario
const PROFILE_DATA = {
  household_size: 4,
  num_adults: 2,
  num_children: 2,
  location_type: 'suburban',
  life_stage: 'established_family',
  employment_status: 'employed',
  monthly_household_income: 7500,
  income_stability: 'stable',
  credit_score: 720,
  total_debt: 45000,
  monthly_debt_payments: 800,
  rent_or_mortgage: 1800,
  savings_goal_monthly: 1000,
  has_health_insurance: true,
  financial_goal_type: 'retirement',
  emergency_fund_months: 3
};

// 12 months of expenses - mix of good and bad months
const MONTHLY_EXPENSES = [
  // Month 1 - January (Good month - controlled spending)
  {
    monthYear: '2024-01',
    housing_utilities: 1800,
    groceries: 600,
    restaurants_cafes: 200,
    transportation_fuel: 250,
    public_transport: 50,
    healthcare_pharmacy: 150,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 150,
    entertainment_hobbies: 180,
    subscriptions: 120,
    other_shopping: 100,
    gifts_charity: 50,
    miscellaneous: 100
  },
  // Month 2 - February (Good month)
  {
    monthYear: '2024-02',
    housing_utilities: 1750,
    groceries: 580,
    restaurants_cafes: 180,
    transportation_fuel: 240,
    public_transport: 50,
    healthcare_pharmacy: 120,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 130,
    entertainment_hobbies: 200,
    subscriptions: 120,
    other_shopping: 90,
    gifts_charity: 100,
    miscellaneous: 80
  },
  // Month 3 - March (Bad month - vacation spending - OVERSPENDING)
  {
    monthYear: '2024-03',
    housing_utilities: 1800,
    groceries: 750,
    restaurants_cafes: 850,
    transportation_fuel: 450,
    public_transport: 120,
    healthcare_pharmacy: 300,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 550,
    entertainment_hobbies: 1200,
    subscriptions: 150,
    other_shopping: 900,
    gifts_charity: 100,
    miscellaneous: 500
  },
  // Month 4 - April (Good month - recovering)
  {
    monthYear: '2024-04',
    housing_utilities: 1750,
    groceries: 600,
    restaurants_cafes: 220,
    transportation_fuel: 260,
    public_transport: 50,
    healthcare_pharmacy: 140,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 140,
    entertainment_hobbies: 190,
    subscriptions: 120,
    other_shopping: 110,
    gifts_charity: 80,
    miscellaneous: 90
  },
  // Month 5 - May (Good month)
  {
    monthYear: '2024-05',
    housing_utilities: 1700,
    groceries: 590,
    restaurants_cafes: 210,
    transportation_fuel: 250,
    public_transport: 50,
    healthcare_pharmacy: 130,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 150,
    entertainment_hobbies: 200,
    subscriptions: 120,
    other_shopping: 100,
    gifts_charity: 60,
    miscellaneous: 85
  },
  // Month 6 - June (Bad month - car repairs + gifts - OVERSPENDING)
  {
    monthYear: '2024-06',
    housing_utilities: 1800,
    groceries: 720,
    restaurants_cafes: 650,
    transportation_fuel: 380,
    public_transport: 80,
    healthcare_pharmacy: 400,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 480,
    entertainment_hobbies: 550,
    subscriptions: 140,
    other_shopping: 850,
    gifts_charity: 400,
    miscellaneous: 1200
  },
  // Month 7 - July (Bad month - summer activities - OVERSPENDING)
  {
    monthYear: '2024-07',
    housing_utilities: 2000,
    groceries: 850,
    restaurants_cafes: 750,
    transportation_fuel: 480,
    public_transport: 100,
    healthcare_pharmacy: 280,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 550,
    entertainment_hobbies: 1100,
    subscriptions: 160,
    other_shopping: 750,
    gifts_charity: 150,
    miscellaneous: 450
  },
  // Month 8 - August (Good month - back to discipline)
  {
    monthYear: '2024-08',
    housing_utilities: 1850,
    groceries: 610,
    restaurants_cafes: 200,
    transportation_fuel: 260,
    public_transport: 50,
    healthcare_pharmacy: 140,
    education_tuition: 500,
    childcare: 800,
    clothing_personal_care: 180,
    entertainment_hobbies: 190,
    subscriptions: 120,
    other_shopping: 120,
    gifts_charity: 70,
    miscellaneous: 100
  },
  // Month 9 - September (Good month)
  {
    monthYear: '2024-09',
    housing_utilities: 1800,
    groceries: 600,
    restaurants_cafes: 190,
    transportation_fuel: 250,
    public_transport: 50,
    healthcare_pharmacy: 130,
    education_tuition: 500,
    childcare: 800,
    clothing_personal_care: 160,
    entertainment_hobbies: 180,
    subscriptions: 120,
    other_shopping: 110,
    gifts_charity: 60,
    miscellaneous: 90
  },
  // Month 10 - October (Good month)
  {
    monthYear: '2024-10',
    housing_utilities: 1800,
    groceries: 620,
    restaurants_cafes: 210,
    transportation_fuel: 260,
    public_transport: 50,
    healthcare_pharmacy: 150,
    education_tuition: 500,
    childcare: 800,
    clothing_personal_care: 170,
    entertainment_hobbies: 200,
    subscriptions: 120,
    other_shopping: 130,
    gifts_charity: 80,
    miscellaneous: 100
  },
  // Month 11 - November (Bad month - holiday shopping begins - OVERSPENDING)
  {
    monthYear: '2024-11',
    housing_utilities: 1900,
    groceries: 850,
    restaurants_cafes: 680,
    transportation_fuel: 390,
    public_transport: 90,
    healthcare_pharmacy: 300,
    education_tuition: 500,
    childcare: 800,
    clothing_personal_care: 600,
    entertainment_hobbies: 750,
    subscriptions: 140,
    other_shopping: 1100,
    gifts_charity: 550,
    miscellaneous: 400
  },
  // Month 12 - December (Bad month - holidays - SEVERE OVERSPENDING)
  {
    monthYear: '2024-12',
    housing_utilities: 2100,
    groceries: 950,
    restaurants_cafes: 850,
    transportation_fuel: 420,
    public_transport: 120,
    healthcare_pharmacy: 350,
    education_tuition: 0,
    childcare: 800,
    clothing_personal_care: 700,
    entertainment_hobbies: 900,
    subscriptions: 160,
    other_shopping: 1300,
    gifts_charity: 800,
    miscellaneous: 600
  }
];

async function createTestAccount() {
  try {
    console.log('\n🚀 Starting test account creation...\n');

    // Step 1: Sign up
    console.log('📝 Step 1: Creating user account...');
    const signupResponse = await axios.post(`${API_URL}/auth/signup`, TEST_USER);
    const token = signupResponse.data.token;
    console.log('✅ User account created successfully');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);

    // Configure headers with token
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // Step 2: Create profile
    console.log('\n📋 Step 2: Setting up profile...');
    await axios.post(`${API_URL}/profile`, PROFILE_DATA, config);
    console.log('✅ Profile created successfully');
    console.log(`   Monthly Income: $${PROFILE_DATA.monthly_household_income}`);
    console.log(`   Household: ${PROFILE_DATA.num_adults} adults, ${PROFILE_DATA.num_children} children`);

    // Step 3: Add expenses for 12 months
    console.log('\n💰 Step 3: Adding 12 months of expenses...');
    let goodMonths = 0;
    let badMonths = 0;

    for (let i = 0; i < MONTHLY_EXPENSES.length; i++) {
      const expense = MONTHLY_EXPENSES[i];
      try {
        const response = await axios.post(`${API_URL}/expenses`, expense, config);
        const totalSpent = response.data.expense.totalExpenses;
        const savings = response.data.expense.savingsThisMonth;
        const isGood = savings >= 500; // Good if saved at least $500
        
        if (isGood) {
          goodMonths++;
          console.log(`   ✓ ${expense.monthYear}: $${totalSpent.toFixed(2)} spent, $${savings.toFixed(2)} saved 🟢 GOOD`);
        } else if (savings >= 0) {
          badMonths++;
          console.log(`   ✓ ${expense.monthYear}: $${totalSpent.toFixed(2)} spent, $${savings.toFixed(2)} saved � TIGHT`);
        } else {
          badMonths++;
          console.log(`   ✓ ${expense.monthYear}: $${totalSpent.toFixed(2)} spent, OVERSPENT by $${Math.abs(savings).toFixed(2)} �🔴 BAD`);
        }
      } catch (error) {
        console.error(`   ✗ Failed to add expenses for ${expense.monthYear}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Good months (saved ≥$500): ${goodMonths}`);
    console.log(`   Bad months (saved <$500): ${badMonths}`);
    console.log(`   Total months: ${MONTHLY_EXPENSES.length}`);

    // Step 4: Get dashboard to show final stats
    console.log('\n📈 Step 4: Fetching final dashboard...');
    const dashboardResponse = await axios.get(`${API_URL}/dashboard`, config);
    const dashboard = dashboardResponse.data;

    console.log('\n✨ Test Account Ready!');
    console.log('═══════════════════════════════════════════════');
    console.log(`📧 Email: ${TEST_USER.email}`);
    console.log(`🔑 Password: ${TEST_USER.password}`);
    console.log('═══════════════════════════════════════════════');
    console.log(`\n💰 Financial Overview:`);
    console.log(`   Monthly Income: $${dashboard.profile.monthlyHouseholdIncome.toFixed(2)}`);
    console.log(`   Total Debt: $${dashboard.profile.totalDebt.toFixed(2)}`);
    console.log(`   Credit Score: ${dashboard.profile.creditScore}`);
    console.log(`   Financial Health Score: ${dashboard.profile.financialHealthScore}/100`);
    console.log(`   Optimization Priority: ${dashboard.profile.optimizationPriority.toUpperCase()}`);
    
    if (dashboard.recentExpenses && dashboard.recentExpenses.length > 0) {
      const latest = dashboard.recentExpenses[0];
      console.log(`\n📅 Latest Month (${latest.monthYear.substring(0, 7)}):`);
      console.log(`   Total Expenses: $${latest.totalExpenses.toFixed(2)}`);
      console.log(`   Savings: $${latest.savingsThisMonth.toFixed(2)}`);
      console.log(`   Meets 50/30/20 Rule: ${latest.meets50_30_20Rule ? '✓' : '✗'}`);
    }

    console.log('\n✅ All done! You can now log in with the credentials above.\n');
    console.log('🌐 Frontend URL: http://localhost:5173');
    console.log('🚀 Happy testing!\n');

  } catch (error) {
    console.error('\n❌ Error creating test account:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data.error || error.response.data);
    } else {
      console.error('   ', error.message);
    }
    console.log('\n⚠️  Make sure the backend server is running on http://localhost:5000\n');
    process.exit(1);
  }
}

// Run the script
createTestAccount();
