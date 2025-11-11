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

const randomEmail = () => `p3_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PHASE 3 COMPLETION TEST - Profile Management');
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

  // Signup
  let token = null;
  let userId = null;
  const email = randomEmail();
  try {
    const resp = await axios.post(`${API_BASE}/auth/signup`, {
      email,
      password: 'StrongP@ssw0rd!',
      firstName: 'Phase',
      lastName: 'Three',
      phone: '+1202555' + Math.floor(10000 + Math.random()*89999),
    });
    token = resp.data?.token;
    userId = resp.data?.user?.id;
    log('Signup user', Boolean(token && userId), `User ${String(userId).slice(0,8)}...`);
  } catch (e) {
    log('Signup user', false, e.response?.data?.error || e.message);
    summary();
    return;
  }

  // Login
  try {
    const resp = await axios.post(`${API_BASE}/auth/login`, { email, password: 'StrongP@ssw0rd!' });
    token = resp.data?.token || token;
    log('Login user', Boolean(resp.data?.token), 'Received JWT');
  } catch (e) {
    log('Login user', false, e.response?.data?.error || e.message);
  }

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // Check profile status (should be false)
  try {
    const resp = await axios.get(`${API_BASE}/auth/check-profile`, auth);
    log('Initial profile status is false', resp.data?.hasProfile === false, `hasProfile=${resp.data?.hasProfile}`);
  } catch (e) {
    log('Initial profile status', false, e.response?.data?.error || e.message);
  }

  // Create profile
  const payload = {
    household_size: 3,
    num_adults: 2,
    num_children: 1,
    location_type: 'urban',
    life_stage: 'young_family',
    employment_status: 'employed',
    monthly_household_income: 8000,
    income_stability: 'stable',
    credit_score: 720,
    total_debt: 15000,
    monthly_debt_payments: 600,
    rent_or_mortgage: 1800,
    savings_goal_monthly: 800,
    has_health_insurance: true,
    financial_goal_type: 'emergency_fund',
    emergency_fund_months: 2,
  };

  try {
    const resp = await axios.post(`${API_BASE}/profile`, payload, auth);
    const p = resp.data?.profile;
    const ratiosOk = Math.abs(p.debtToIncomeRatio - (payload.monthly_debt_payments/payload.monthly_household_income)) < 1e-6
                  && Math.abs(p.housingCostRatio - (payload.rent_or_mortgage/payload.monthly_household_income)) < 1e-6
                  && Math.abs(p.savingsRatePercentage - (payload.savings_goal_monthly/payload.monthly_household_income)) < 1e-6
                  && p.monthlySavingsActual === 0
                  && p.financialHealthScore === 0;
    log('Create profile endpoint', Boolean(p && ratiosOk), `Derived OK=${ratiosOk}`);
  } catch (e) {
    log('Create profile endpoint', false, e.response?.data?.errors?.join?.(', ') || e.response?.data?.error || e.message);
  }

  // Check profile status (true)
  try {
    const resp = await axios.get(`${API_BASE}/auth/check-profile`, auth);
    log('Profile status after create is true', resp.data?.hasProfile === true, `hasProfile=${resp.data?.hasProfile}`);
  } catch (e) {
    log('Profile status after create', false, e.response?.data?.error || e.message);
  }

  // Get profile
  try {
    const resp = await axios.get(`${API_BASE}/profile`, auth);
    log('Get profile returns object', Boolean(resp.data?.profile?.id), `Profile id=${String(resp.data?.profile?.id).slice(0,8)}...`);
  } catch (e) {
    log('Get profile returns object', false, e.response?.data?.error || e.message);
  }

  // Update profile and validate new ratios
  const updated = { ...payload, monthly_household_income: 10000, rent_or_mortgage: 2500, monthly_debt_payments: 500, savings_goal_monthly: 1000 };
  try {
    const resp = await axios.put(`${API_BASE}/profile`, updated, auth);
    const p = resp.data?.profile;
    const ratiosOk = Math.abs(p.debtToIncomeRatio - (updated.monthly_debt_payments/updated.monthly_household_income)) < 1e-6
                  && Math.abs(p.housingCostRatio - (updated.rent_or_mortgage/updated.monthly_household_income)) < 1e-6
                  && Math.abs(p.savingsRatePercentage - (updated.savings_goal_monthly/updated.monthly_household_income)) < 1e-6;
    log('Update profile endpoint recomputes ratios', Boolean(p && ratiosOk), `Derived OK=${ratiosOk}`);
  } catch (e) {
    log('Update profile endpoint', false, e.response?.data?.errors?.join?.(', ') || e.response?.data?.error || e.message);
  }

  summary();
}

function summary() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n  Total Tests: ${results.passed + results.failed}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  const pct = (results.passed + results.failed) ? Math.round((results.passed / (results.passed + results.failed)) * 100) : 0;
  console.log(`\n  Success Rate: ${pct}%\n`);
}

run().catch((e)=>{
  console.error('Test runner error:', e);
  summary();
});
