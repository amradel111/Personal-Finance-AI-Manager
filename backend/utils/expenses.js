const CATEGORY_FIELDS = [
  'housingUtilities',
  'groceries',
  'restaurantsCafes',
  'transportationFuel',
  'publicTransport',
  'healthcarePharmacy',
  'educationTuition',
  'childcare',
  'clothingPersonalCare',
  'entertainmentHobbies',
  'subscriptions',
  'otherShopping',
  'giftsCharity',
  'miscellaneous',
];

const ESSENTIAL_FIELDS = [
  'housingUtilities',
  'groceries',
  'transportationFuel',
  'publicTransport',
  'healthcarePharmacy',
  'educationTuition',
  'childcare',
];

const toAmount = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return n;
};

const parseMonthYear = (value) => {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  const m = /^([0-9]{4})-([0-9]{2})(?:-[0-9]{2})?$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return new Date(Date.UTC(y, mo - 1, 1));
};

const normalizeCategoryAmounts = (payload) => {
  const amounts = {};
  for (const key of CATEGORY_FIELDS) {
    const n = toAmount(payload[key] ?? 0);
    if (!Number.isFinite(n)) return { error: key };
    amounts[key] = n;
  }
  return { amounts };
};

const computeTotals = (amounts) => {
  let total = 0;
  let essential = 0;
  let discretionary = 0;
  let highestKey = null;
  let highestVal = -1;
  for (const key of CATEGORY_FIELDS) {
    const v = amounts[key] || 0;
    total += v;
    if (ESSENTIAL_FIELDS.includes(key)) essential += v; else discretionary += v;
    if (v > highestVal) {
      highestVal = v;
      highestKey = key;
    }
  }
  const essentialRatio = total > 0 ? essential / total : 0;
  const discretionaryRatio = total > 0 ? discretionary / total : 0;
  return {
    totalExpenses: total,
    totalEssentialSpending: essential,
    totalDiscretionarySpending: discretionary,
    essentialSpendingRatio: essentialRatio,
    discretionarySpendingRatio: discretionaryRatio,
    highestSpendingCategory: highestKey || 'none',
  };
};

const evaluateRule503020 = (income, essential, discretionary, savings) => {
  if (!Number.isFinite(income) || income <= 0) return false;
  const e = essential / income;
  const d = discretionary / income;
  const s = savings / income;
  return e <= 0.5 && d <= 0.3 && s >= 0.2;
};

module.exports = {
  CATEGORY_FIELDS,
  ESSENTIAL_FIELDS,
  toAmount,
  parseMonthYear,
  normalizeCategoryAmounts,
  computeTotals,
  evaluateRule503020,
};
