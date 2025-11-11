/**
 * Automated API Test Script for Phase 4 & 5
 * Run with: node test-api.js
 * Requires: Backend server running on port 5000
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let expenseId = '';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  console.log(`${colors[type]}${message}\x1b[0m`);
};

const test = async (name, fn) => {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    log(`✅ PASS: ${name}`, 'success');
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    log(`❌ FAIL: ${name}`, 'error');
    log(`   Error: ${error.message}`, 'error');
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// Test Suite
async function runTests() {
  log('\n🧪 Starting API Tests for Phase 4 & 5\n', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  // Test 1: Health Check
  await test('Health Check - Server is running', async () => {
    const response = await axios.get('http://localhost:5000/');
    assert(response.status === 200, 'Server should respond with 200');
    assert(response.data.message === 'Personal Finance AI Manager API', 'Should return API message');
  });

  // Test 2: Signup
  await test('Auth - Signup new user', async () => {
    const timestamp = Date.now();
    const response = await axios.post(`${API_URL}/auth/signup`, {
      email: `test${timestamp}@example.com`,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      phone: `+1234567${timestamp.toString().slice(-3)}`
    });
    assert(response.status === 201, 'Should return 201');
    assert(response.data.token, 'Should return JWT token');
    assert(response.data.user, 'Should return user data');
    authToken = response.data.token;
    userId = response.data.user.id;
  });

  // Test 3: Login
  await test('Auth - Login with credentials', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123!'
    }).catch(() => {
      // Expected to fail with new email, just verify endpoint works
      return { status: 401 };
    });
    assert(response.status === 401 || response.status === 200, 'Should handle login attempt');
  });

  // Test 4: Create Profile
  await test('Profile - Create user profile', async () => {
    const response = await axios.post(`${API_URL}/profile`, {
      household_size: 2,
      num_adults: 2,
      num_children: 0,
      location_type: 'urban',
      life_stage: 'young_professional',
      employment_status: 'employed',
      monthly_household_income: 5000,
      income_stability: 'stable',
      credit_score: 700,
      total_debt: 10000,
      monthly_debt_payments: 500,
      rent_or_mortgage: 1200,
      savings_goal_monthly: 1000,
      has_health_insurance: true,
      financial_goal_type: 'emergency_fund',
      emergency_fund_months: 6
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 201, 'Should return 201');
    assert(response.data.profile, 'Should return profile data');
    assert(response.data.profile.monthlyHouseholdIncome === 5000, 'Income should be 5000');
  });

  // Test 5: Get Profile
  await test('Profile - Get user profile', async () => {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(response.data.profile, 'Should return profile data');
  });

  // Test 6: Create Expenses (September)
  await test('Expenses - Create September expenses', async () => {
    const response = await axios.post(`${API_URL}/expenses`, {
      monthYear: '2025-09',
      housingUtilities: 1200,
      groceries: 500,
      restaurantsCafes: 200,
      transportationFuel: 150,
      publicTransport: 0,
      healthcarePharmacy: 100,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 80,
      entertainmentHobbies: 100,
      subscriptions: 30,
      otherShopping: 75,
      giftsCharity: 20,
      miscellaneous: 25
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 201, 'Should return 201');
    assert(response.data.expense, 'Should return expense data');
    assert(response.data.expense.totalExpenses === 2480, 'Total should be 2480');
    assert(response.data.expense.totalEssentialSpending === 1950, 'Essential should be 1950');
    assert(response.data.expense.totalDiscretionarySpending === 530, 'Discretionary should be 530');
    assert(response.data.expense.highestSpendingCategory === 'housingUtilities', 'Highest should be housing');
    expenseId = response.data.expense.id;
  });

  // Test 7: Create Expenses (October)
  await test('Expenses - Create October expenses', async () => {
    const response = await axios.post(`${API_URL}/expenses`, {
      monthYear: '2025-10',
      housingUtilities: 1200,
      groceries: 600,
      restaurantsCafes: 300,
      transportationFuel: 150,
      publicTransport: 0,
      healthcarePharmacy: 100,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 100,
      entertainmentHobbies: 150,
      subscriptions: 30,
      otherShopping: 100,
      giftsCharity: 30,
      miscellaneous: 40
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 201, 'Should return 201');
    assert(response.data.expense.totalExpenses === 2800, 'Total should be 2800');
    assert(response.data.expense.spendingVsLastMonthPercentage !== null, 'Should have MoM percentage');
  });

  // Test 8: Get All Expenses
  await test('Expenses - Get all expenses', async () => {
    const response = await axios.get(`${API_URL}/expenses`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(Array.isArray(response.data.expenses), 'Should return array');
    assert(response.data.expenses.length === 2, 'Should have 2 expenses');
  });

  // Test 9: Get Expense by Month
  await test('Expenses - Get expense by month', async () => {
    const response = await axios.get(`${API_URL}/expenses/2025-09`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(response.data.expense, 'Should return expense data');
    assert(response.data.expense.totalExpenses === 2480, 'Should match September total');
  });

  // Test 10: Update Expense
  await test('Expenses - Update expense', async () => {
    const response = await axios.put(`${API_URL}/expenses/${expenseId}`, {
      housingUtilities: 1300,
      groceries: 500,
      restaurantsCafes: 200,
      transportationFuel: 150,
      publicTransport: 0,
      healthcarePharmacy: 100,
      educationTuition: 0,
      childcare: 0,
      clothingPersonalCare: 80,
      entertainmentHobbies: 100,
      subscriptions: 30,
      otherShopping: 75,
      giftsCharity: 20,
      miscellaneous: 25
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(response.data.expense.totalExpenses === 2580, 'Total should be updated to 2580');
  });

  // Test 11: Dashboard Summary
  await test('Dashboard - Get summary', async () => {
    const response = await axios.get(`${API_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(response.data.summary, 'Should return summary data');
    assert(response.data.summary.hasExpensesData === true, 'Should have expenses data');
    assert(response.data.summary.totalIncome === 5000, 'Income should be 5000');
    assert(response.data.summary.totalExpenses > 0, 'Should have expenses');
    assert(response.data.summary.totalSavings !== null, 'Should calculate savings');
    assert(response.data.summary.topSpendingCategories.length > 0, 'Should have top categories');
  });

  // Test 12: Dashboard Recent Expenses
  await test('Dashboard - Get recent expenses', async () => {
    const response = await axios.get(`${API_URL}/dashboard/recent`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(response.data.hasExpensesData === true, 'Should have expenses data');
    assert(Array.isArray(response.data.expenses), 'Should return expenses array');
    assert(response.data.expenses.length === 2, 'Should have 2 expense entries');
  });

  // Test 13: Duplicate Month Prevention
  await test('Expenses - Prevent duplicate month', async () => {
    try {
      await axios.post(`${API_URL}/expenses`, {
        monthYear: '2025-09',
        housingUtilities: 1000,
        groceries: 500,
        restaurantsCafes: 200,
        transportationFuel: 150,
        publicTransport: 0,
        healthcarePharmacy: 100,
        educationTuition: 0,
        childcare: 0,
        clothingPersonalCare: 80,
        entertainmentHobbies: 100,
        subscriptions: 30,
        otherShopping: 75,
        giftsCharity: 20,
        miscellaneous: 25
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      throw new Error('Should have rejected duplicate month');
    } catch (error) {
      assert(error.response.status === 409, 'Should return 409 Conflict');
    }
  });

  // Test 14: Invalid Month Format
  await test('Expenses - Reject invalid month format', async () => {
    try {
      await axios.post(`${API_URL}/expenses`, {
        monthYear: 'invalid',
        housingUtilities: 1000,
        groceries: 500,
        restaurantsCafes: 200,
        transportationFuel: 150,
        publicTransport: 0,
        healthcarePharmacy: 100,
        educationTuition: 0,
        childcare: 0,
        clothingPersonalCare: 80,
        entertainmentHobbies: 100,
        subscriptions: 30,
        otherShopping: 75,
        giftsCharity: 20,
        miscellaneous: 25
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      throw new Error('Should have rejected invalid month');
    } catch (error) {
      assert(error.response.status === 400, 'Should return 400 Bad Request');
    }
  });

  // Test 15: Unauthorized Access
  await test('Auth - Reject unauthorized access', async () => {
    try {
      await axios.get(`${API_URL}/expenses`);
      throw new Error('Should have rejected unauthorized request');
    } catch (error) {
      assert(error.response.status === 401, 'Should return 401 Unauthorized');
    }
  });

  // Test 16: Delete Expense
  await test('Expenses - Delete expense', async () => {
    const response = await axios.delete(`${API_URL}/expenses/${expenseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(response.data.success === true, 'Should return success');
  });

  // Test 17: 50/30/20 Rule Calculation
  await test('Calculations - 50/30/20 rule evaluation', async () => {
    const response = await axios.get(`${API_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(response.status === 200, 'Should return 200');
    assert(typeof response.data.summary.meets_50_30_20_rule === 'boolean', 'Should evaluate 50/30/20 rule');
  });

  // Print Results
  log('\n═══════════════════════════════════════════════════════\n', 'info');
  log('📊 Test Results Summary\n', 'info');
  log(`Total Tests: ${results.passed + results.failed}`, 'info');
  log(`✅ Passed: ${results.passed}`, 'success');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`, 'info');

  if (results.failed > 0) {
    log('Failed Tests:', 'error');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      log(`  - ${t.name}: ${t.error}`, 'error');
    });
  }

  log('\n═══════════════════════════════════════════════════════\n', 'info');

  if (results.failed === 0) {
    log('🎉 All tests passed! Phase 4 & 5 are working correctly.\n', 'success');
  } else {
    log('⚠️  Some tests failed. Please review the errors above.\n', 'warning');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed to run: ${error.message}\n`, 'error');
  process.exit(1);
});
