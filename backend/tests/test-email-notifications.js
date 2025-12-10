/**
 * Test Email Notifications
 * Sends example emails for each notification type to verify the email service works
 */

require('dotenv').config();
const {
  sendMonthlyReportReminder,
  sendBudgetAlert,
  sendFinancialHealthAlert,
} = require('./utils/emailService');

const TEST_EMAIL = 'megahedx369@gmail.com';
const TEST_NAME = 'Ahmed'; // Feel free to change this

async function sendTestEmails() {
  console.log('Starting Email Notification Tests...\n');
  console.log(`Sending test emails to: ${TEST_EMAIL}\n`);

  try {
    // Test 1: Monthly Report Reminder
    console.log('[1/8] Sending Monthly Report Reminder...');
    await sendMonthlyReportReminder({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      lastReportMonth: 'October 2025',
    });
    console.log('      SUCCESS: Monthly Report Reminder sent\n');

    // Wait a bit between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Budget Alert - Near Limit (80%)
    console.log('[2/8] Sending Budget Alert (80% utilization)...');
    await sendBudgetAlert({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      category: 'Restaurants & Dining',
      spent: 320,
      budget: 400,
      percentageUsed: 80,
    });
    console.log('      SUCCESS: Budget Alert (80%) sent\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Budget Alert - Over Budget
    console.log('[3/8] Sending Budget Alert (Over Budget)...');
    await sendBudgetAlert({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      category: 'Entertainment',
      spent: 275,
      budget: 250,
      percentageUsed: 110,
    });
    console.log('      SUCCESS: Budget Alert (Over Budget) sent\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Financial Health Alert - Low Health Score
    console.log('[4/8] Sending Financial Health Alert (Low Score)...');
    await sendFinancialHealthAlert({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      alertType: 'low-health-score',
      details: { score: 42 },
    });
    console.log('      SUCCESS: Low Health Score Alert sent\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Financial Health Alert - No Emergency Fund
    console.log('[5/8] Sending Financial Health Alert (No Emergency Fund)...');
    await sendFinancialHealthAlert({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      alertType: 'no-emergency-fund',
      details: {},
    });
    console.log('      SUCCESS: No Emergency Fund Alert sent\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 6: Financial Health Alert - High Debt
    console.log('[6/8] Sending Financial Health Alert (High Debt-to-Income Ratio)...');
    await sendFinancialHealthAlert({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      alertType: 'high-debt',
      details: { debtToIncomeRatio: 45 },
    });
    console.log('      SUCCESS: High Debt Alert sent\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 7: Financial Health Alert - Overspending Pattern
    console.log('[7/8] Sending Financial Health Alert (Overspending Pattern)...');
    await sendFinancialHealthAlert({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      alertType: 'overspending',
      details: { consecutiveMonths: 3 },
    });
    console.log('      SUCCESS: Overspending Alert sent\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 8: Financial Health Alert - Low Savings Rate
    console.log('[8/8] Sending Financial Health Alert (Low Savings Rate)...');
    await sendFinancialHealthAlert({
      to: TEST_EMAIL,
      firstName: TEST_NAME,
      alertType: 'low-savings-rate',
      details: { savingsRate: 5 },
    });
    console.log('      SUCCESS: Low Savings Rate Alert sent\n');

    console.log('\n========================================');
    console.log('All test emails sent successfully!');
    console.log('========================================\n');
    console.log(`Recipient: ${TEST_EMAIL}`);
    console.log('Note: Emails may take a few minutes to arrive.');
    console.log('      Check spam folder if not received in inbox.\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('ERROR: Failed to send test emails');
    console.error('========================================');
    console.error(error.message);
    
    if (error.message.includes('SMTP')) {
      console.log('\nREQUIRED: Configure SMTP settings in your .env file:');
      console.log('----------------------------------------');
      console.log('SMTP_HOST=smtp.gmail.com');
      console.log('SMTP_PORT=587');
      console.log('SMTP_USER=your-email@gmail.com');
      console.log('SMTP_PASS=your-app-password');
      console.log('MAIL_FROM_EMAIL=no-reply@savemate.app');
      console.log('MAIL_FROM_NAME=SaveMate');
      console.log('----------------------------------------\n');
    }
    
    process.exit(1);
  }
}

// Check if SMTP is configured
if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
  console.log('========================================');
  console.log('SMTP Configuration Required');
  console.log('========================================\n');
  console.log('Email notifications cannot be sent without SMTP configuration.');
  console.log('\nAdd the following variables to your backend/.env file:\n');
  console.log('SMTP_HOST=smtp.gmail.com');
  console.log('SMTP_PORT=587');
  console.log('SMTP_SECURE=false');
  console.log('SMTP_USER=your-email@gmail.com');
  console.log('SMTP_PASS=your-app-password');
  console.log('MAIL_FROM_EMAIL=no-reply@savemate.app');
  console.log('MAIL_FROM_NAME=SaveMate');
  console.log('CLIENT_URL=http://localhost:3000\n');
  console.log('Note: For Gmail, use App Password from Google Account settings');
  console.log('      https://support.google.com/accounts/answer/185833\n');
  process.exit(0);
}

sendTestEmails();
