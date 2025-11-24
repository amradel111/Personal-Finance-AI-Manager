const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testUserId = '';

async function testBudgets() {
  console.log('\n🧪 Testing Budget Feature...\n');

  try {
    // 1. Signup
    console.log('→ Creating test user...');
    const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
      firstName: 'Budget',
      lastName: 'Tester',
      email: `budgettest${Date.now()}@test.com`,
      password: 'Test123!@#',
      phone: `555${Date.now().toString().slice(-7)}`
    });
    console.log('✓ User created');

    // 2. Login
    console.log('→ Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: signupRes.data.user.email,
      password: 'Test123!@#'
    });
    authToken = loginRes.data.token;
    testUserId = loginRes.data.user.id;
    console.log('✓ Logged in');

    const config = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    // 3. Set a budget
    console.log('→ Setting budget for groceries ($500)...');
    const setBudgetRes = await axios.post(`${BASE_URL}/api/budgets`, {
      category: 'groceries',
      amount: 500,
      monthYear: '2025-11-01'
    }, config);
    console.log('✓ Budget set:', setBudgetRes.data);

    // 4. Get budgets
    console.log('→ Fetching budgets for November 2025...');
    const getBudgetsRes = await axios.get(`${BASE_URL}/api/budgets?monthYear=2025-11-01`, config);
    console.log('✓ Budgets retrieved:', getBudgetsRes.data);

    if (getBudgetsRes.data.length > 0 && getBudgetsRes.data[0].budgetedAmount === 500) {
      console.log('\n✅ Budget persistence test PASSED\n');
    } else {
      console.log('\n❌ Budget persistence test FAILED\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error(error);
  }
}

testBudgets();
