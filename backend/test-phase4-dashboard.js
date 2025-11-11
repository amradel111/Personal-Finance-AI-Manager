const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5000/api';

const results = { passed: 0, failed: 0, tests: [] };

const log = (name, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed += 1;
  } else {
    results.failed += 1;
  }
};

const randomEmail = () => `p4_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PHASE 4 DASHBOARD TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$connect();

  let token = null;
  let userId = null;

  try {
    // Health check
    try {
      const resp = await axios.get('http://localhost:5000', { timeout: 4000 });
      log('Backend server running', resp.status === 200, resp.data?.status || 'OK');
    } catch (error) {
      log('Backend server running', false, 'Backend not reachable on :5000');
      return summary();
    }

    // Signup user
    const email = randomEmail();
    const password = 'Str0ngP@ssw0rd!';
    let phoneNumber = '+1202' + Math.floor(1000000 + Math.random() * 8999999);
    try {
      const resp = await axios.post(`${API_BASE}/auth/signup`, {
        email,
        password,
        firstName: 'Phase',
        lastName: 'Four',
        phone: phoneNumber,
      });
      token = resp.data?.token;
      userId = resp.data?.user?.id;
      log('Signup user', Boolean(token && userId), `User ${String(userId || '').slice(0, 8)}...`);
    } catch (error) {
      const details = error.response?.data?.error || error.message;
      log('Signup user', false, details);
      return summary();
    }

    // Login user
    try {
      const resp = await axios.post(`${API_BASE}/auth/login`, { email, password });
      token = resp.data?.token || token;
      log('Login user', Boolean(resp.data?.token), 'Received JWT');
    } catch (error) {
      const details = error.response?.data?.error || error.message;
      log('Login user', false, details);
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Initial dashboard summary (expect no expenses)
    try {
      const resp = await axios.get(`${API_BASE}/dashboard/summary`, authHeaders);
      const hasNoExpenses = resp.data?.summary?.hasExpensesData === false;
      log('Dashboard summary (no data)', hasNoExpenses, `hasExpensesData=${resp.data?.summary?.hasExpensesData}`);
    } catch (error) {
      const details = error.response?.data?.error || error.message;
      log('Dashboard summary (no data)', false, details);
    }

    // Initial recent expenses (expect none)
    try {
      const resp = await axios.get(`${API_BASE}/dashboard/recent`, authHeaders);
      const ok = resp.data?.hasExpensesData === false && Array.isArray(resp.data?.expenses) && resp.data.expenses.length === 0;
      log('Dashboard recent (no data)', ok, `hasExpensesData=${resp.data?.hasExpensesData}`);
    } catch (error) {
      const details = error.response?.data?.error || error.message;
      log('Dashboard recent (no data)', false, details);
    }

    // Create profile via API
    const profilePayload = {
      household_size: 2,
      num_adults: 2,
      num_children: 0,
      location_type: 'urban',
      life_stage: 'young_professional',
      employment_status: 'employed',
      monthly_household_income: 8500,
      income_stability: 'stable',
      credit_score: 720,
      total_debt: 12000,
      monthly_debt_payments: 400,
      rent_or_mortgage: 1800,
      savings_goal_monthly: 1700,
      has_health_insurance: true,
      financial_goal_type: 'emergency_fund',
      emergency_fund_months: 3,
    };

    try {
      const resp = await axios.post(`${API_BASE}/profile`, profilePayload, authHeaders);
      log('Create profile for dashboard', Boolean(resp.data?.profile?.id), `Profile ${String(resp.data?.profile?.id || '').slice(0, 8)}...`);
    } catch (error) {
      const details = error.response?.data?.error || error.response?.data?.errors?.join?.(', ') || error.message;
      log('Create profile for dashboard', false, details);
    }

    // Insert expense data directly via Prisma for dashboard tests
    const expenseData = {
      userId,
      monthYear: new Date('2025-10-01T00:00:00.000Z'),
      housingUtilities: 2100,
      groceries: 650,
      restaurantsCafes: 400,
      transportationFuel: 250,
      publicTransport: 120,
      healthcarePharmacy: 180,
      educationTuition: 0,
      childcare: 300,
      clothingPersonalCare: 220,
      entertainmentHobbies: 900,
      subscriptions: 85,
      otherShopping: 150,
      giftsCharity: 60,
      miscellaneous: 75,
      totalExpenses: 5490,
      totalEssentialSpending: 3600,
      totalDiscretionarySpending: 1890,
      essentialSpendingRatio: 3600 / 8500,
      discretionarySpendingRatio: 1890 / 8500,
      savingsThisMonth: 8500 - 5490,
      spendingVsLastMonthPercentage: 12,
      highestSpendingCategory: 'housing_utilities',
      meets50_30_20Rule: false,
    };

    let createdExpense = null;
    try {
      createdExpense = await prisma.monthlyExpense.create({ data: expenseData });
      log('Insert monthly expense for dashboard', Boolean(createdExpense?.id), `Expense ${String(createdExpense?.id || '').slice(0, 8)}...`);
    } catch (error) {
      log('Insert monthly expense for dashboard', false, error.message || 'Failed to insert expense');
    }

    // Dashboard summary with data
    try {
      const resp = await axios.get(`${API_BASE}/dashboard/summary`, authHeaders);
      const summary = resp.data?.summary;
      const checks = [
        summary?.hasExpensesData === true,
        Math.abs((summary?.totalIncome ?? 0) - profilePayload.monthly_household_income) < 1e-6,
        Math.abs((summary?.totalExpenses ?? 0) - expenseData.totalExpenses) < 1e-6,
        Math.abs((summary?.totalSavings ?? 0) - expenseData.savingsThisMonth) < 1e-6,
        Math.abs((summary?.savingsRate ?? 0) - (expenseData.savingsThisMonth / profilePayload.monthly_household_income)) < 1e-6,
        Array.isArray(summary?.topSpendingCategories) && summary.topSpendingCategories.length >= 3 && summary.topSpendingCategories[0]?.key === 'housing_utilities',
      ];
      log('Dashboard summary (with data)', checks.every(Boolean), JSON.stringify(summary, null, 2));
    } catch (error) {
      const details = error.response?.data?.error || error.message;
      log('Dashboard summary (with data)', false, details);
    }

    // Dashboard recent expenses with data
    try {
      const resp = await axios.get(`${API_BASE}/dashboard/recent`, authHeaders);
      const payload = resp.data;
      const first = payload?.expenses?.[0];
      const checks = [
        payload?.hasExpensesData === true,
        Array.isArray(payload?.expenses) && payload.expenses.length >= 1,
        first?.id === createdExpense?.id,
        Array.isArray(first?.topCategories) && first.topCategories.length >= 3 && first.topCategories[0]?.key === 'housing_utilities',
      ];
      log('Dashboard recent (with data)', checks.every(Boolean), JSON.stringify(first, null, 2));
    } catch (error) {
      const details = error.response?.data?.error || error.message;
      log('Dashboard recent (with data)', false, details);
    }
  } finally {
    if (userId) {
      try {
        await prisma.monthlyExpense.deleteMany({ where: { userId } });
        await prisma.userProfile.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
    }

    await prisma.$disconnect();
    summary();
  }
}

function summary() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n  Total Tests: ${results.passed + results.failed}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  const pct = (results.passed + results.failed)
    ? Math.round((results.passed / (results.passed + results.failed)) * 100)
    : 0;
  console.log(`\n  Success Rate: ${pct}%\n`);
}

run().catch((error) => {
  console.error('Test runner error:', error);
  summary();
});
