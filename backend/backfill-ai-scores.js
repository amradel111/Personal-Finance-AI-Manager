/**
 * Backfill AI Scores for All Historical Months
 * Run this script ONCE to populate AI health scores for all existing expense records.
 * 
 * Usage: node backfill-ai-scores.js
 */

const prisma = require('./config/database');

const ML_SERVICE_URL = 'http://localhost:5001';

async function getInsights(userData) {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('ML service error:', error.message);
        return null;
    }
}

async function backfillAIScores() {
    console.log('🚀 Starting AI backfill for all historical months...\n');

    // Check ML service
    try {
        const health = await fetch(`${ML_SERVICE_URL}/health`);
        if (!health.ok) throw new Error('ML service not responding');
        console.log('✅ ML service is healthy\n');
    } catch (error) {
        console.error('❌ ML Service not running. Start it with: python app.py');
        process.exit(1);
    }

    // Fetch all users with their profiles and expenses
    const users = await prisma.user.findMany({
        include: {
            profile: true,
            expenses: {
                orderBy: { monthYear: 'asc' },
            },
        },
    });

    console.log(`Found ${users.length} user(s)\n`);

    let totalProcessed = 0;
    let totalErrors = 0;

    for (const user of users) {
        console.log(`\n📊 Processing user: ${user.email}`);
        const profile = user.profile;
        const allExpenses = user.expenses;

        if (!allExpenses.length) {
            console.log('   No expenses found, skipping');
            continue;
        }

        const income = profile?.monthlyHouseholdIncome || 0;
        const totalDebt = profile?.totalDebt || 0;

        for (let i = 0; i < allExpenses.length; i++) {
            const expense = allExpenses[i];
            const monthLabel = expense.monthYear.toISOString().slice(0, 7);

            // Get historical expenses up to this point
            const historicalExpenses = allExpenses
                .slice(0, i + 1)
                .map(e => e.totalExpenses)
                .filter(e => e != null);

            const userData = {
                income,
                expenses: expense.totalExpenses || 0,
                savings: expense.savingsThisMonth || 0,
                total_debt: totalDebt,
                historical_expenses: historicalExpenses,
            };

            try {
                const insights = await getInsights(userData);

                if (insights && insights.health) {
                    await prisma.monthlyExpense.update({
                        where: { id: expense.id },
                        data: {
                            aiHealthScore: insights.health.score,
                            aiHealthCategory: insights.health.category,
                            aiForecastNextMonth: insights.forecast?.next_month || null,
                            aiForecastTrend: insights.forecast?.trend || null,
                            aiProcessedAt: new Date(),
                        },
                    });
                    console.log(`   ✅ ${monthLabel}: AI Score = ${insights.health.score} (${insights.health.category})`);
                    totalProcessed++;
                } else {
                    console.log(`   ⚠️  ${monthLabel}: No insights returned`);
                    totalErrors++;
                }
            } catch (err) {
                console.log(`   ❌ ${monthLabel}: Error - ${err.message}`);
                totalErrors++;
            }
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Backfill complete!`);
    console.log(`   Processed: ${totalProcessed} months`);
    console.log(`   Errors: ${totalErrors}`);
    console.log('='.repeat(50) + '\n');

    await prisma.$disconnect();
}

backfillAIScores().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
