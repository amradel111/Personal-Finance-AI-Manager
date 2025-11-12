const prisma = require('./config/database');
const { computeFinancialHealth } = require('./utils/health');

async function fixHealthScores() {
  try {
    console.log('🔧 Fixing health scores for all users...\n');

    // Get all users with profiles
    const profiles = await prisma.userProfile.findMany({
      include: {
        user: true,
      },
    });

    if (profiles.length === 0) {
      console.log('❌ No profiles found in the database.\n');
      return;
    }

    console.log(`📋 Found ${profiles.length} profile(s) to update\n`);

    for (const profile of profiles) {
      const userId = profile.userId;
      const userEmail = profile.user.email;

      console.log(`👤 Processing: ${userEmail}`);

      // Get the latest expense record for this user
      const latestExpense = await prisma.monthlyExpense.findFirst({
        where: { userId },
        orderBy: { monthYear: 'desc' },
      });

      if (!latestExpense) {
        console.log('   ⚠️  No expenses found - skipping\n');
        continue;
      }

      // Compute the financial health assessment
      const assessment = computeFinancialHealth(profile, latestExpense);

      console.log(`   📊 Current Health Score: ${profile.financialHealthScore}`);
      console.log(`   ✨ New Health Score: ${assessment.financialHealthScore}`);
      console.log(`   🎯 Optimization Priority: ${assessment.optimizationPriority}`);
      console.log(`   💯 Overall Health: ${assessment.overallFinancialHealth}`);

      // Update the profile with the new health score and optimization priority
      await prisma.userProfile.update({
        where: { userId },
        data: {
          financialHealthScore: assessment.financialHealthScore,
          optimizationPriority: assessment.optimizationPriority,
          monthlySavingsActual: latestExpense.savingsThisMonth,
        },
      });

      console.log(`   ✅ Updated successfully!\n`);
    }

    console.log('🎉 All health scores updated successfully!\n');
  } catch (error) {
    console.error('❌ Error fixing health scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixHealthScores();
