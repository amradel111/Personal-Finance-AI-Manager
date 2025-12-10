/**
 * ML Service Client
 * 
 * Communicates with the Python ML API to get AI-powered insights.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Make a request to the ML service
 */
async function mlRequest(endpoint, data = {}) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`ML Service request failed for ${endpoint}:`, error.message);
    return null;
  }
}

/**
 * Get financial health prediction
 */
async function getHealthPrediction(userData) {
  return mlRequest('/predict/health', userData);
}

/**
 * Get expense forecast
 */
async function getExpenseForecast(historicalExpenses, monthsAhead = 1) {
  return mlRequest('/predict/forecast', {
    historical_expenses: historicalExpenses,
    months_ahead: monthsAhead,
  });
}

/**
 * Detect spending anomalies
 */
async function detectAnomaly(amount, averageMonthlySpending) {
  return mlRequest('/predict/anomaly', {
    amount,
    average_monthly_spending: averageMonthlySpending,
  });
}

/**
 * Get comprehensive AI insights
 */
async function getInsights(userData) {
  return mlRequest('/insights', userData);
}

/**
 * Check if ML service is available
 */
async function checkMLServiceHealth() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Train models with provided data
 */
async function trainModels() {
  return mlRequest('/train', {});
}

/**
 * Batch process all users
 */
async function batchProcessUsers(usersData) {
  return mlRequest('/batch/process-all-users', { users: usersData });
}

module.exports = {
  getHealthPrediction,
  getExpenseForecast,
  detectAnomaly,
  getInsights,
  checkMLServiceHealth,
  trainModels,
  batchProcessUsers,
  ML_SERVICE_URL,
};
