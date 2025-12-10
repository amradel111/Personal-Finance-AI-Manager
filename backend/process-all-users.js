/**
 * Process All Users Script
 * 
 * Run this script to generate AI insights for all existing users in the database.
 * Usage: node process-all-users.js
 */

const prisma = require('./config/database');
const mlService = require('./utils/mlService');

async function processAllUsers() {
    console.log('🤖 Starting ML Processing for All Users...\n');

    // Check if ML service is available
    const isMLAvailable = await mlService.checkMLServiceHealth();
    if (!isMLAvailable) {
        console.error('❌ ML Service is not running!');
        console.log('   Start it with: cd "ML model" && python app.py');
        process.exit(1);
    }
    console.log('✅ ML Service is available\n');

    // Fetch all users with their profiles and expenses
    const users = await prisma.user.findMany({
        include: {
            profile: true,
            expenses: {
                orderBy: { monthYear: 'asc' },
                take: 12,
            },
        },
    });

    console.log(`📊 Found ${users.length} users in the database\n`);

    if (users.length === 0) {
        console.log('No users to process. Add some users first!');
        process.exit(0);
    }

    // Transform users data for ML service
    const usersData = users.map(user => {
        const profile = user.profile;
        const expenses = user.expenses;
        const historicalExpenses = expenses.map(e => e.totalExpenses).filter(e => e != null);
        const latestExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;

        return {
            id: user.id,
            email: user.email,
            income: profile?.monthlyHouseholdIncome || 0,
            expenses: latestExpense?.totalExpenses || 0,
            savings: latestExpense?.savingsThisMonth || 0,
            total_debt: profile?.totalDebt || 0,
            monthly_debt_payments: profile?.monthlyDebtPayments || 0,
            savings_rate: profile?.savingsRatePercentage || 0,
            emergency_fund_months: profile?.emergencyFundMonths || 0,
            historical_expenses: historicalExpenses,
        };
    });

    console.log('Sending data to ML Service for processing...\n');

    // Send to ML service for batch processing
    const mlResults = await mlService.batchProcessUsers(usersData);

    if (!mlResults) {
        console.error('❌ Failed to get results from ML service');
        process.exit(1);
    }

    // Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log('                   ML PROCESSING RESULTS                ');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Total Processed: ${mlResults.total_processed}`);
    console.log(`Successful:      ${mlResults.successful}`);
    console.log(`Failed:          ${mlResults.failed}\n`);

    // Show individual results
    console.log('User Results:');
    console.log('─────────────────────────────────────────────────────────');

    for (const result of mlResults.results) {
        const user = users.find(u => u.id === result.user_id);
        const email = user?.email || result.user_id;

        if (result.status === 'success') {
            const insights = result.insights;
            console.log(`\n📧 ${email}`);
            console.log(`   Health Score: ${insights.health.score} (${insights.health.category})`);
            if (insights.forecast) {
                console.log(`   Forecast:     $${insights.forecast.next_month} (${insights.forecast.trend})`);
            }
            if (insights.recommendations?.[0]) {
                console.log(`   Tip:          ${insights.recommendations[0].message}`);
            }
        } else {
            console.log(`\n❌ ${email}: ${result.error}`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                   PROCESSING COMPLETE                  ');
    console.log('═══════════════════════════════════════════════════════\n');
}

processAllUsers()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
