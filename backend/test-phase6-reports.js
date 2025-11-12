/**
 * Phase 6 Reports API Test
 * Run with: node test-phase6-reports.js (backend server must be running on port 5000)
 */
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const results = { passed: 0, failed: 0, tests: [] };
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const test = async (name, fn) => {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✅ PASS: ${name}`);
  } catch (e) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: e.message });
    console.error(`❌ FAIL: ${name} - ${e.message}`);
  }
};

async function run() {
  console.log('\n🧪 Phase 6: Reports API Tests');
  console.log('────────────────────────────────────────────\n');

  let token = '';

  await test('Health check', async () => {
    const res = await axios.get('http://localhost:5000/');
    assert(res.status === 200, 'API should respond 200');
  });

  const ts = Date.now();
  const email = `phase6_${ts}@example.com`;
  const phone = `+1999${String(ts).slice(-7)}`;

  await test('Signup', async () => {
    const res = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password: 'TestPass123!',
      firstName: 'Phase',
      lastName: 'Six',
      phone,
    });
    assert(res.status === 201, 'Signup should return 201');
    assert(res.data && res.data.token, 'Signup should return token');
    token = res.data.token;
  });

  await test('Create Profile', async () => {
    const res = await axios.post(`${API_URL}/profile`, {
      household_size: 2,
      num_adults: 2,
      num_children: 0,
      location_type: 'urban',
      life_stage: 'young_professional',
      employment_status: 'employed',
      monthly_household_income: 5000,
      income_stability: 'stable',
      credit_score: 700,
      total_debt: 12000,
      monthly_debt_payments: 500,
      rent_or_mortgage: 1300,
      savings_goal_monthly: 1000,
      has_health_insurance: true,
      financial_goal_type: 'emergency_fund',
      emergency_fund_months: 4
    }, { headers: { Authorization: `Bearer ${token}` } });
    assert(res.status === 201, 'Profile should return 201');
  });

  await test('Create Expenses - Sep 2025', async () => {
    const res = await axios.post(`${API_URL}/expenses`, {
      monthYear: '2025-09',
      housingUtilities: 1300,
      groceries: 550,
      restaurantsCafes: 220,
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
    }, { headers: { Authorization: `Bearer ${token}` } });
    assert(res.status === 201, 'Create expenses Sep should return 201');
  });

  await test('Create Expenses - Oct 2025', async () => {
    const res = await axios.post(`${API_URL}/expenses`, {
      monthYear: '2025-10',
      housingUtilities: 1300,
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
    }, { headers: { Authorization: `Bearer ${token}` } });
    assert(res.status === 201, 'Create expenses Oct should return 201');
  });

  let history;
  await test('Report History', async () => {
    const res = await axios.get(`${API_URL}/reports/history`, { headers: { Authorization: `Bearer ${token}` } });
    assert(res.status === 200, 'History should return 200');
    assert(Array.isArray(res.data.months) && res.data.months.length >= 2, 'History should list months');
    history = res.data.months;
  });

  await test('Monthly Report (2025-10)', async () => {
    const res = await axios.get(`${API_URL}/reports/monthly/2025-10`, { headers: { Authorization: `Bearer ${token}` } });
    assert(res.status === 200, 'Monthly report should return 200');
    assert(res.data.hasData === true, 'Monthly report should have data');
    assert(res.data.report && res.data.report.categoryBreakdown.length > 0, 'Should include category breakdown');
    assert(typeof res.data.report.savingsRate === 'number', 'Should include savings rate');
    assert(res.data.assessment && typeof res.data.assessment.financialHealthScore === 'number', 'Should include assessment score');
  });

  console.log('\n────────────────────────────────────────────');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  if (results.failed > 0) process.exit(1);
}

run().catch((e) => { console.error('Fatal error:', e.message); process.exit(1); });
