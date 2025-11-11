const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

let results = { passed: 0, failed: 0, tests: [] };
const log = (name, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);
  results.tests.push({ name, passed, details });
  if (passed) results.passed++; else results.failed++;
};

const randomEmail = (prefix='p3e') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;

async function signupAndLogin(email) {
  const password = 'StrongP@ssw0rd!';
  await axios.post(`${API_BASE}/auth/signup`, {
    email,
    password,
    firstName: 'Ext',
    lastName: 'Tests',
    phone: '+1202555' + Math.floor(10000 + Math.random()*89999),
  });
  const loginResp = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return loginResp.data?.token;
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PHASE 3 EXTENDED TESTS - Negative & Edge Cases');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Health check
  try {
    const resp = await axios.get('http://localhost:5000', { timeout: 3000 });
    log('Backend server running', resp.status === 200, resp.data?.status || 'OK');
  } catch (e) {
    log('Backend server running', false, 'Backend not reachable on :5000');
    summary();
    return;
  }

  // 1) Unauthorized access should be rejected
  try {
    await axios.get(`${API_BASE}/profile`);
    log('Unauthorized GET /profile rejected', false, 'Should be 401');
  } catch (e) {
    log('Unauthorized GET /profile rejected', e.response?.status === 401);
  }
  try {
    await axios.post(`${API_BASE}/profile`, {});
    log('Unauthorized POST /profile rejected', false, 'Should be 401');
  } catch (e) {
    log('Unauthorized POST /profile rejected', e.response?.status === 401);
  }
  try {
    await axios.put(`${API_BASE}/profile`, {});
    log('Unauthorized PUT /profile rejected', false, 'Should be 401');
  } catch (e) {
    log('Unauthorized PUT /profile rejected', e.response?.status === 401);
  }

  // 2) New user: GET /profile returns 404, update returns 404
  const tokenUserA = await signupAndLogin(randomEmail('userA'));
  const authA = { headers: { Authorization: `Bearer ${tokenUserA}` } };
  try {
    await axios.get(`${API_BASE}/profile`, authA);
    log('GET /profile 404 for new user', false, 'Expected 404');
  } catch (e) {
    log('GET /profile 404 for new user', e.response?.status === 404);
  }
  try {
    await axios.put(`${API_BASE}/profile`, { monthly_household_income: 0 }, authA);
    log('PUT /profile 404 when no existing profile', false, 'Expected 404');
  } catch (e) {
    log('PUT /profile 404 when no existing profile', e.response?.status === 404);
  }

  // 3) Validation errors on create
  // 3.a income <= 0
  try {
    await axios.post(`${API_BASE}/profile`, {
      household_size: 1,
      num_adults: 1,
      num_children: 0,
      location_type: 'urban',
      life_stage: 'young_professional',
      employment_status: 'employed',
      monthly_household_income: 0, // invalid
      income_stability: 'stable',
      credit_score: 700,
      total_debt: 0,
      monthly_debt_payments: 0,
      rent_or_mortgage: 0,
      savings_goal_monthly: 0,
      has_health_insurance: true,
      financial_goal_type: 'emergency_fund',
      emergency_fund_months: 0,
    }, authA);
    log('Create profile rejects income <= 0', false, 'Expected 400');
  } catch (e) {
    log('Create profile rejects income <= 0', e.response?.status === 400);
  }

  // 3.b invalid enum value
  try {
    await axios.post(`${API_BASE}/profile`, {
      household_size: 1,
      num_adults: 1,
      num_children: 0,
      location_type: 'city', // invalid
      life_stage: 'young_professional',
      employment_status: 'employed',
      monthly_household_income: 5000,
      income_stability: 'stable',
      credit_score: 700,
      total_debt: 0,
      monthly_debt_payments: 0,
      rent_or_mortgage: 0,
      savings_goal_monthly: 0,
      has_health_insurance: true,
      financial_goal_type: 'emergency_fund',
      emergency_fund_months: 0,
    }, authA);
    log('Create profile rejects invalid enum', false, 'Expected 400');
  } catch (e) {
    log('Create profile rejects invalid enum', e.response?.status === 400);
  }

  // 3.c credit score out of range
  try {
    await axios.post(`${API_BASE}/profile`, {
      household_size: 1,
      num_adults: 1,
      num_children: 0,
      location_type: 'urban',
      life_stage: 'young_professional',
      employment_status: 'employed',
      monthly_household_income: 5000,
      income_stability: 'stable',
      credit_score: 200, // invalid
      total_debt: 0,
      monthly_debt_payments: 0,
      rent_or_mortgage: 0,
      savings_goal_monthly: 0,
      has_health_insurance: true,
      financial_goal_type: 'emergency_fund',
      emergency_fund_months: 0,
    }, authA);
    log('Create profile rejects invalid credit score', false, 'Expected 400');
  } catch (e) {
    log('Create profile rejects invalid credit score', e.response?.status === 400);
  }

  // 4) Create valid profile, then duplicate should 409
  const validPayload = {
    household_size: 2,
    num_adults: 2,
    num_children: 0,
    location_type: 'urban',
    life_stage: 'young_professional',
    employment_status: 'employed',
    monthly_household_income: 6000,
    income_stability: 'stable',
    credit_score: 710,
    total_debt: 5000,
    monthly_debt_payments: 200,
    rent_or_mortgage: 1500,
    savings_goal_monthly: 600,
    has_health_insurance: true,
    financial_goal_type: 'emergency_fund',
    emergency_fund_months: 1,
  };
  try {
    const resp = await axios.post(`${API_BASE}/profile`, validPayload, authA);
    log('Create valid profile succeeds', Boolean(resp.data?.profile?.id));
  } catch (e) {
    log('Create valid profile succeeds', false, e.response?.data?.error || e.message);
  }
  try {
    await axios.post(`${API_BASE}/profile`, validPayload, authA);
    log('Duplicate profile creation rejected with 409', false);
  } catch (e) {
    log('Duplicate profile creation rejected with 409', e.response?.status === 409);
  }

  // 5) Update with invalid payload → 400
  try {
    await axios.put(`${API_BASE}/profile`, { ...validPayload, credit_score: 900 }, authA);
    log('Update profile rejects invalid data', false);
  } catch (e) {
    log('Update profile rejects invalid data', e.response?.status === 400);
  }

  // 6) New user B update without profile → 404
  const tokenUserB = await signupAndLogin(randomEmail('userB'));
  const authB = { headers: { Authorization: `Bearer ${tokenUserB}` } };
  try {
    await axios.put(`${API_BASE}/profile`, validPayload, authB);
    log('Update without existing profile returns 404', false);
  } catch (e) {
    log('Update without existing profile returns 404', e.response?.status === 404);
  }

  summary();
}

function summary() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXTENDED TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n  Total Tests: ${results.passed + results.failed}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  const pct = (results.passed + results.failed) ? Math.round((results.passed / (results.passed + results.failed)) * 100) : 0;
  console.log(`\n  Success Rate: ${pct}%\n`);
}

run().catch((e)=>{
  console.error('Extended test runner error:', e);
  summary();
});
