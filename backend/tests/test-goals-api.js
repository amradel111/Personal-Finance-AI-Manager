// Quick test script for goals API endpoints
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid JWT token from your login
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

async function testGoalsAPI() {
  console.log('🧪 Testing Goals API Endpoints\n');

  try {
    // Test 1: Get all goals (should be empty initially)
    console.log('1. GET /api/goals');
    const getResponse = await api.get('/goals');
    console.log('✅ Success:', JSON.stringify(getResponse.data, null, 2));
    console.log('');

    // Test 2: Create a new goal
    console.log('2. POST /api/goals');
    const createResponse = await api.post('/goals', {
      name: 'Emergency Fund',
      type: 'emergency_fund',
      target_amount: 10000,
      start_month_year: '2025-01',
      target_month_year: '2025-12'
    });
    console.log('✅ Success:', JSON.stringify(createResponse.data, null, 2));
    const goalId = createResponse.data.goal.id;
    console.log('');

    // Test 3: Get all goals again (should include the new goal)
    console.log('3. GET /api/goals (after creation)');
    const getResponse2 = await api.get('/goals');
    console.log('✅ Success:', JSON.stringify(getResponse2.data, null, 2));
    console.log('');

    // Test 4: Update the goal
    console.log(`4. PUT /api/goals/${goalId}`);
    const updateResponse = await api.put(`/goals/${goalId}`, {
      name: 'Updated Emergency Fund',
      target_amount: 15000
    });
    console.log('✅ Success:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // Test 5: Delete the goal
    console.log(`5. DELETE /api/goals/${goalId}`);
    const deleteResponse = await api.delete(`/goals/${goalId}`);
    console.log('✅ Success:', JSON.stringify(deleteResponse.data, null, 2));
    console.log('');

    console.log('🎉 All tests passed!');

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Instructions
console.log('📝 Before running this test:');
console.log('1. Make sure the backend server is running on port 5000');
console.log('2. Login via /api/auth/login to get a JWT token');
console.log('3. Replace TEST_TOKEN in this file with your actual token');
console.log('4. Run: node test-goals-api.js\n');

if (TEST_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('⚠️  Please set a valid JWT token first!');
  process.exit(1);
}

testGoalsAPI();
