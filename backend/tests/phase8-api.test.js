const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const { computeTotals, CATEGORY_FIELDS } = require('../utils/expenses');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const HEALTHCHECK_URL = process.env.HEALTH_URL || 'http://localhost:5000/';
const BACKEND_ROOT = path.join(__dirname, '..');
const SHOULD_BOOT_SERVER = process.env.SKIP_SERVER_BOOT !== '1';

const timestamp = Date.now();
const state = {
  email: `phase8_tester_${timestamp}@example.com`,
  password: 'TestPass123!',
  newEmail: `phase8_tester_${timestamp}_updated@example.com`,
  newPassword: 'NewPass456!',
  phone: `+1234567${String(timestamp).slice(-4)}`,
  token: '',
  userId: '',
  expenses: new Map(),
  income: 0,
  monthlyDebtPayments: 0,
};

const results = { passed: 0, failed: 0, tests: [] };
let serverProcess = null;
let shuttingDown = false;

const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  };
  console.log(`${colors[type] || colors.info}${message}\x1b[0m`);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const expectClose = (a, b, tolerance = 0.0001, message = 'Values differ beyond tolerance') => {
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error(`${message}: received NaN`);
  }
  if (Math.abs(a - b) > tolerance) {
    throw new Error(`${message}: expected ${b}, received ${a}`);
  }
};

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${state.token}`,
  },
});

const categorySlice = (payload) => {
  const slice = {};
  for (const key of CATEGORY_FIELDS) {
    slice[key] = Number(payload[key] ?? 0);
  }
  return slice;
};

const startServer = () => {
  const serverPath = path.join(BACKEND_ROOT, 'server.js');
  const child = spawn(process.execPath, [serverPath], {
    cwd: BACKEND_ROOT,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  log('Booting backend server...', 'info');
  return child;
};

const stopServer = () => {
  if (!serverProcess || shuttingDown) return;
  shuttingDown = true;
  log('Stopping backend server...', 'warning');
  try {
    serverProcess.kill('SIGTERM');
  } catch (_) {
    /* noop */
  }
};

const waitForServer = async (timeoutMs = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(HEALTHCHECK_URL, { timeout: 1000 });
      if (res.status === 200) {
        log('Server is ready.', 'success');
        return;
      }
    } catch (_) {
      // keep polling
    }
    await delay(500);
  }
  throw new Error('Server did not become ready within timeout.');
};

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const recordResult = (name, status, error) => {
  if (status === 'PASS') {
    results.passed += 1;
  } else {
    results.failed += 1;
  }
  results.tests.push({ name, status, error });
};

const test = async (name, fn) => {
  log(`→ ${name}`, 'info');
  try {
    await fn();
    recordResult(name, 'PASS');
    log(`✔ PASS: ${name}`, 'success');
  } catch (error) {
    recordResult(name, 'FAIL', error.message);
    log(`✖ FAIL: ${name} — ${error.message}`, 'error');
    throw error;
  }
};

const profilePayload = {
  household_size: 3,
  num_adults: 2,
  num_children: 1,
  location_type: 'urban',
  life_stage: 'young_family',
  employment_status: 'employed',
  monthly_household_income: 7200,
  income_stability: 'stable',
  credit_score: 720,
  total_debt: 20000,
  monthly_debt_payments: 650,
  rent_or_mortgage: 2000,
  savings_goal_monthly: 1200,
  has_health_insurance: true,
  financial_goal_type: 'home',
  emergency_fund_months: 4,
};

const updatedProfilePayload = {
  ...profilePayload,
  monthly_household_income: 7600,
  monthly_debt_payments: 600,
  savings_goal_monthly: 1500,
  rent_or_mortgage: 1950,
  emergency_fund_months: 5,
  financial_goal_type: 'retirement',
};

const baseExpenseTemplate = () => ({
  housingUtilities: 1900,
  groceries: 650,
  restaurantsCafes: 240,
  transportationFuel: 220,
  publicTransport: 90,
  healthcarePharmacy: 140,
  educationTuition: 100,
  childcare: 320,
  clothingPersonalCare: 180,
  entertainmentHobbies: 220,
  subscriptions: 65,
  otherShopping: 110,
  giftsCharity: 55,
  miscellaneous: 70,
});

const buildExpensePayload = (monthYear, overrides = {}) => ({
  monthYear,
  ...baseExpenseTemplate(),
  ...overrides,
});

const createExpenseForMonth = async (monthYear, overrides = {}) => {
  const payload = buildExpensePayload(monthYear, overrides);
  const categoryValues = categorySlice(payload);
  const totals = computeTotals(categoryValues);
  const response = await request.post('/expenses', payload, authHeaders());
  expect(response.status === 201, 'Expense creation should return 201');
  const expense = response.data.expense;
  expect(expense && expense.id, 'Expense response should include id');
  expect(expense.monthYear.startsWith(monthYear), 'Expense monthYear should match request');
  expect(expense.totalExpenses === totals.totalExpenses, 'Total expenses mismatch');
  expect(expense.totalEssentialSpending === totals.totalEssentialSpending, 'Essential total mismatch');
  expect(expense.totalDiscretionarySpending === totals.totalDiscretionarySpending, 'Discretionary total mismatch');
  if (state.income > 0) {
    const expectedSavings = state.income - totals.totalExpenses - state.monthlyDebtPayments;
    expectClose(expense.savingsThisMonth, expectedSavings, 0.01, 'Savings mismatch');
  }
  state.expenses.set(monthYear, { id: expense.id, totals, data: expense });
  return expense;
};

const runSuite = async () => {
  await test('Health check responds with API message', async () => {
    const res = await axios.get(HEALTHCHECK_URL);
    expect(res.status === 200, 'Health check must return 200');
    expect(res.data.message.includes('Personal Finance AI Manager'), 'Health message mismatch');
  });

  await test('Signup creates a new user', async () => {
    const res = await request.post('/auth/signup', {
      email: state.email,
      password: state.password,
      firstName: 'Phase8',
      lastName: 'Tester',
      phone: state.phone,
    });
    expect(res.status === 201, 'Signup should return 201');
    expect(res.data.token, 'Signup should return token');
    state.token = res.data.token;
    state.userId = res.data.user.id;
  });

  await test('Duplicate signup is rejected', async () => {
    try {
      await request.post('/auth/signup', {
        email: state.email,
        password: state.password,
        firstName: 'Phase8',
        lastName: 'Tester',
        phone: state.phone,
      });
      throw new Error('Duplicate signup should fail');
    } catch (error) {
      expect(error.response?.status === 409, 'Expected 409 for duplicate signup');
    }
  });

  await test('Login returns token for valid credentials', async () => {
    const res = await request.post('/auth/login', {
      email: state.email,
      password: state.password,
    });
    expect(res.status === 200, 'Login should return 200');
    expect(res.data.token, 'Login should return token');
    state.token = res.data.token;
  });

  await test('Login fails with wrong password', async () => {
    try {
      await request.post('/auth/login', {
        email: state.email,
        password: 'WrongPass123!',
      });
      throw new Error('Login should fail with wrong password');
    } catch (error) {
      expect(error.response?.status === 401, 'Expected 401 for invalid login');
    }
  });

  await test('Protected route rejects missing token', async () => {
    try {
      await request.get('/profile');
      throw new Error('Request without token should fail');
    } catch (error) {
      expect(error.response?.status === 401, 'Expected 401 without token');
    }
  });

  await test('Auth profile endpoint returns user data', async () => {
    const res = await request.get('/auth/profile', authHeaders());
    expect(res.status === 200, 'Auth profile should return 200');
    expect(res.data.user.email === state.email, 'Auth profile email mismatch');
    expect(res.data.user.profile === null, 'Profile should be null before setup');
  });

  await test('Profile status reports incomplete before setup', async () => {
    const res = await request.get('/auth/check-profile', authHeaders());
    expect(res.status === 200, 'Check profile should return 200');
    expect(res.data.hasProfile === false, 'hasProfile should be false initially');
  });

  await test('Profile validation rejects invalid payload', async () => {
    try {
      await request.post('/profile', {
        household_size: 0,
        location_type: 'invalid',
      }, authHeaders());
      throw new Error('Invalid profile payload should fail');
    } catch (error) {
      expect(error.response?.status === 400, 'Invalid profile should return 400');
      expect(Array.isArray(error.response?.data?.errors), 'Errors array expected');
    }
  });

  await test('Profile can be created with full dataset', async () => {
    const res = await request.post('/profile', profilePayload, authHeaders());
    expect(res.status === 201, 'Profile create should return 201');
    expect(res.data.profile.householdSize === profilePayload.household_size, 'Household size mismatch');
  });

  await test('Profile status reports complete after setup', async () => {
    const res = await request.get('/auth/check-profile', authHeaders());
    expect(res.data.hasProfile === true, 'Profile completion should be true');
  });

  await test('Duplicate profile create is rejected', async () => {
    try {
      await request.post('/profile', profilePayload, authHeaders());
      throw new Error('Duplicate profile should fail');
    } catch (error) {
      expect(error.response?.status === 409, 'Expected 409 for duplicate profile');
    }
  });

  await test('Profile can be fetched', async () => {
    const res = await request.get('/profile', authHeaders());
    expect(res.status === 200, 'Profile get should return 200');
    expect(res.data.profile.employmentStatus === profilePayload.employment_status, 'Employment status mismatch');
  });

  await test('Profile can be updated', async () => {
    const res = await request.put('/profile', updatedProfilePayload, authHeaders());
    expect(res.status === 200, 'Profile update should return 200');
    expect(res.data.profile.monthlyHouseholdIncome === updatedProfilePayload.monthly_household_income, 'Income update mismatch');
    state.income = res.data.profile.monthlyHouseholdIncome;
    state.monthlyDebtPayments = res.data.profile.monthlyDebtPayments;
  });

  await test('Expense validation rejects negative amounts', async () => {
    try {
      await request.post('/expenses', {
        monthYear: '2025-07',
        housingUtilities: -10,
      }, authHeaders());
      throw new Error('Negative expense should fail');
    } catch (error) {
      expect(error.response?.status === 400, 'Expected 400 for invalid expense');
    }
  });

  const monthList = ['2025-08', '2025-09', '2025-10'];
  await test('Create baseline expenses for test months', async () => {
    for (const [index, month] of monthList.entries()) {
      const overrides = index === 1
        ? { restaurantsCafes: 320, entertainmentHobbies: 260 }
        : index === 2
          ? { groceries: 700, otherShopping: 180, giftsCharity: 80 }
          : {};
      await createExpenseForMonth(month, overrides);
    }
  });

  await test('Duplicate month expense is rejected', async () => {
    try {
      await createExpenseForMonth(monthList[0]);
      throw new Error('Duplicate month should fail');
    } catch (error) {
      expect(error.response?.status === 409, 'Expected 409 for duplicate month');
    }
  });

  await test('Get all expenses returns expected count', async () => {
    const res = await request.get('/expenses', authHeaders());
    expect(res.status === 200, 'Get expenses should return 200');
    expect(res.data.expenses.length === state.expenses.size, 'Expenses count mismatch');
  });

  await test('Get expense by month returns correct record', async () => {
    const res = await request.get(`/expenses/${monthList[1]}`, authHeaders());
    expect(res.status === 200, 'Get expense by month should return 200');
    expect(res.data.expense.monthYear.startsWith(monthList[1]), 'Month lookup mismatch');
  });

  await test('Invalid month format returns 400', async () => {
    try {
      await request.get('/expenses/invalid-month', authHeaders());
      throw new Error('Invalid month should fail');
    } catch (error) {
      expect(error.response?.status === 400, 'Expected 400 for invalid month');
    }
  });

  await test('Update expense recalculates totals', async () => {
    const monthToUpdate = monthList[1];
    const expenseId = state.expenses.get(monthToUpdate).id;
    const res = await request.put(`/expenses/${expenseId}`, {
      restaurantsCafes: 350,
      subscriptions: 80,
    }, authHeaders());
    expect(res.status === 200, 'Update should return 200');
    expect(res.data.expense.restaurantsCafes === 350, 'Updated field mismatch');
  });

  await test('Dashboard summary reflects latest data', async () => {
    const res = await request.get('/dashboard/summary', authHeaders());
    expect(res.status === 200, 'Dashboard summary should return 200');
    expect(res.data.summary.hasExpensesData === true, 'Dashboard should detect expenses');
    expect(res.data.summary.totalIncome === state.income, 'Dashboard income mismatch');
  });

  await test('Dashboard recent expenses returns history', async () => {
    const res = await request.get('/dashboard/recent', authHeaders());
    expect(res.status === 200, 'Dashboard recent should return 200');
    expect(res.data.expenses.length >= state.expenses.size, 'Recent expenses should include created months');
  });

  await test('Report history lists created months', async () => {
    const res = await request.get('/reports/history', authHeaders());
    expect(res.status === 200, 'Report history should return 200');
    expect(res.data.months.length === state.expenses.size, 'History count mismatch');
  });

  await test('Monthly report aggregates income vs expenses', async () => {
    const targetMonth = monthList[0];
    const res = await request.get(`/reports/monthly/${targetMonth}`, authHeaders());
    expect(res.status === 200, 'Monthly report should return 200');
    expect(res.data.hasData === true, 'Monthly report should have data');
    const { report } = res.data;
    expect(report.monthYear.startsWith(targetMonth), 'Report month mismatch');
    expect(report.totalExpenses > 0, 'Report total expenses should be > 0');
    expect(report.income === state.income, 'Report income mismatch');
    expect(Array.isArray(report.categoryBreakdown), 'Category breakdown should be array');
  });

  await test('Monthly report handles months without expenses', async () => {
    const res = await request.get('/reports/monthly/2024-01', authHeaders());
    expect(res.status === 200, 'Report for empty month should return 200');
    expect(res.data.hasData === false, 'Should flag missing data');
  });

  await test('Account email can be updated', async () => {
    const res = await request.put('/auth/update-account', { email: state.newEmail }, authHeaders());
    expect(res.status === 200, 'Update account should return 200');
    expect(res.data.user.email === state.newEmail, 'Updated email mismatch');
    state.email = state.newEmail;
  });

  await test('Password can be changed', async () => {
    const res = await request.put('/auth/change-password', {
      currentPassword: state.password,
      newPassword: state.newPassword,
    }, authHeaders());
    expect(res.status === 200, 'Change password should return 200');
  });

  await test('Old password no longer works after change', async () => {
    try {
      await request.post('/auth/login', {
        email: state.email,
        password: state.password,
      });
      throw new Error('Old password should fail after change');
    } catch (error) {
      expect(error.response?.status === 401, 'Expected 401 for old password');
    }
  });

  await test('Login succeeds with new password', async () => {
    const res = await request.post('/auth/login', {
      email: state.email,
      password: state.newPassword,
    });
    expect(res.status === 200, 'Login with new password should succeed');
    state.token = res.data.token;
  });

  await test('Invalid token is rejected by middleware', async () => {
    try {
      await request.get('/dashboard/summary', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      throw new Error('Invalid token should fail');
    } catch (error) {
      expect(error.response?.status === 401, 'Expected 401 for invalid token');
    }
  });

  await test('Expense delete removes record', async () => {
    const monthToDelete = monthList[2];
    const expenseId = state.expenses.get(monthToDelete).id;
    const res = await request.delete(`/expenses/${expenseId}`, authHeaders());
    expect(res.status === 200, 'Delete should return 200');
    state.expenses.delete(monthToDelete);
  });

  await test('Expenses list reflects deletion', async () => {
    const res = await request.get('/expenses', authHeaders());
    expect(res.data.expenses.length === state.expenses.size, 'Expenses count should match after delete');
  });

  await test('Report history updates after deletion', async () => {
    const res = await request.get('/reports/history', authHeaders());
    expect(res.data.months.length === state.expenses.size, 'History should reflect deletion');
  });
};

const printSummary = () => {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('Phase 8 API Test Summary', 'info');
  log(`Total: ${results.passed + results.failed}`, 'info');
  log(`Passed: ${results.passed}`, results.failed === 0 ? 'success' : 'info');
  log(`Failed: ${results.failed}`, results.failed === 0 ? 'success' : 'error');
  if (results.failed > 0) {
    log('Failed tests:', 'error');
    results.tests.filter((t) => t.status === 'FAIL').forEach((t) => {
      log(` - ${t.name}: ${t.error}`, 'error');
    });
  }
  log('═══════════════════════════════════════════════════════\n', 'info');
};

const main = async () => {
  try {
    if (SHOULD_BOOT_SERVER) {
      serverProcess = startServer();
    } else {
      log('SKIP_SERVER_BOOT=1 detected, assuming server already running', 'warning');
    }

    await waitForServer();
    await runSuite();
    printSummary();
    process.exit(0);
  } catch (error) {
    printSummary();
    process.exit(1);
  } finally {
    stopServer();
  }
};

process.on('SIGINT', () => {
  stopServer();
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopServer();
  process.exit(1);
});

main();
