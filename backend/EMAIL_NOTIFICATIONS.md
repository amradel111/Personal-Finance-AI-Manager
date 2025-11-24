# Email Notifications - Implementation Guide

## Overview

The Personal Finance AI Manager now includes a comprehensive email notification system that keeps users engaged and informed about their financial health. This feature implements **Phase 10.1.2** from the project tasks.

## Notification Types

### 1. Monthly Report Reminders 📊
Sends monthly reminders to users to review their financial reports.

**Triggers:**
- Automated: First week of each month
- Manual: User can request via API

**Content:**
- Professional business greeting
- Current reporting period
- Value proposition for report review
- Direct action link to Monthly Report page
- Historical review tracking

---

### 2. Budget Alerts

Notifies users when they approach or exceed their budget in specific categories.

**Triggers:**
- 80% of budget used (warning)
- 90% of budget used (urgent warning)
- 100%+ of budget used (over budget alert)

**Content:**
- Category name and alert level
- Amount spent vs budget
- Percentage used (color-coded)
- Actionable tips
- Remaining budget (if under limit)
- Direct link to Expenses page

**Alert Severity Levels:**
- BUDGET NOTICE (70-89%): Approaching threshold
- BUDGET WARNING (90-99%): Nearing limit
- OVER BUDGET (100%+): Exceeded allocation

---

### 3. Financial Health Alerts

Alerts users about important financial health issues that need attention.

**Alert Types:**

#### a) Low Health Score
**Trigger:** Financial health score drops below 50/100

**Content:**
- Current health score with context
- Priority level indicator (HIGH PRIORITY)
- Evidence-based recommendations:
  - Comprehensive spending pattern analysis
  - Emergency fund establishment/strengthening
  - High-interest debt reduction prioritization
  - Structured budget framework development

---

#### b) No Emergency Fund
**Trigger:** User has less than 1 month of expenses saved

**Content:**
- Reserve status notification with industry standards
- Target recommendation (3-6 months of expenses)
- Structured implementation strategy:
  - Initial reserve target ($500-$1,000)
  - Automated transfer configuration
  - Budget optimization for savings allocation

---

#### c) High Debt-to-Income Ratio
**Trigger:** DTI ratio > 40%

**Content:**
- Current DTI percentage
- Risk explanation
- Debt reduction strategies:
  - Pay high-interest debt first
  - Consider consolidation
  - Avoid new debt
  - Create payoff plan

---

#### d) Overspending Pattern 💸
**Trigger:** Spending > Income for 2+ consecutive months

**Content:**
- Number of consecutive overspending months
- Trend warning
- Corrective actions:
  - Track all expenses
  - Cut unnecessary subscriptions
  - Set category limits
  - Explore income opportunities

---

#### e) Low Savings Rate 💰
**Trigger:** Savings rate < 10%

**Content:**
- Current savings rate
- Recommended rate (20%)
- Savings improvement tips:
  - 50/30/20 rule
  - Automate savings
  - Reduce discretionary spending
  - Increase income

---

## Setup Instructions

### 1. Configure SMTP Settings

Add these variables to your `backend/.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM_EMAIL=no-reply@savemate.app
MAIL_FROM_NAME=SaveMate
CLIENT_URL=http://localhost:3000
```

### 2. Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll to **App passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use it as `SMTP_PASS` in your `.env` file

**Important:** Never use your regular Gmail password. Always use an App Password.

---

## Testing

### Quick Test Script

Run the test script to send example emails:

```bash
cd backend
node test-email-notifications.js
```

This will send 8 example emails to `megahedx369@gmail.com`:
1. Monthly Report Reminder
2. Budget Alert (80% used)
3. Budget Alert (Over budget)
4. Low Health Score Alert
5. No Emergency Fund Alert
6. High Debt Alert
7. Overspending Alert
8. Low Savings Rate Alert

---

## API Endpoints

### 1. Send Monthly Report Reminder

```http
POST /api/notifications/monthly-reminder
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "lastReportMonth": "October 2025" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Monthly report reminder sent successfully"
}
```

---

### 2. Send Budget Alert

```http
POST /api/notifications/budget-alert
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "category": "Restaurants & Dining",
  "spent": 320,
  "budget": 400,
  "percentageUsed": 80
}
```

**Response:**
```json
{
  "success": true,
  "message": "Budget alert sent successfully"
}
```

---

### 3. Send Financial Health Alert

```http
POST /api/notifications/health-alert
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "alertType": "low-health-score",
  "details": {
    "score": 42
  }
}
```

**Valid Alert Types:**
- `low-health-score`
- `no-emergency-fund`
- `high-debt`
- `overspending`
- `low-savings-rate`

**Response:**
```json
{
  "success": true,
  "message": "Financial health alert sent successfully"
}
```

---

## Integration Points

### Automatic Triggers (Future Implementation)

The email system is ready to be integrated with automatic triggers:

#### 1. Monthly Report Reminders
```javascript
// In a scheduled job (e.g., node-cron)
const cron = require('node-cron');
const { sendMonthlyReportReminder } = require('./utils/emailService');

// Run on the 1st of every month at 9 AM
cron.schedule('0 9 1 * *', async () => {
  const users = await prisma.user.findMany({
    where: { emailNotifications: true }
  });
  
  for (const user of users) {
    await sendMonthlyReportReminder({
      to: user.email,
      firstName: user.firstName,
      lastReportMonth: user.lastReportView
    });
  }
});
```

#### 2. Budget Alerts
```javascript
// In expensesController.js after saving expenses
const categoryBudgets = userProfile.categoryBudgets; // assuming this exists

for (const [category, budget] of Object.entries(categoryBudgets)) {
  const spent = expenses[category] || 0;
  const percentageUsed = Math.round((spent / budget) * 100);
  
  if (percentageUsed >= 80) {
    await sendBudgetAlert({
      to: user.email,
      firstName: user.firstName,
      category,
      spent,
      budget,
      percentageUsed
    });
  }
}
```

#### 3. Financial Health Alerts
```javascript
// In health.js after computing health score
const { score, flags } = computeFinancialHealth(profile, expenses);

if (score < 50) {
  await sendFinancialHealthAlert({
    to: user.email,
    firstName: user.firstName,
    alertType: 'low-health-score',
    details: { score }
  });
}

if (flags.needs_emergency_fund) {
  await sendFinancialHealthAlert({
    to: user.email,
    firstName: user.firstName,
    alertType: 'no-emergency-fund',
    details: {}
  });
}
```

---

## Email Design Features

### Professional Design
- Enterprise-standard layout with modern typography
- Mobile-responsive HTML templates
- Consistent corporate branding (SaveMate)
- Color-coded priority indicators
- Clear visual hierarchy with structured sections

### Mobile-Friendly
- Readable on all devices
- Touch-friendly buttons
- Optimized font sizes
- No horizontal scrolling

### Accessibility
- Plain text fallback for all HTML emails
- WCAG 2.1 compliant contrast ratios
- Semantic HTML5 structure
- Screen reader friendly markup

### Security
- No sensitive data in emails
- Secure password reset links
- Time-limited tokens
- HTTPS links only

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration**
   ```bash
   # Verify .env file has all required variables
   cat backend/.env | grep SMTP
   ```

2. **Test SMTP Connection**
   ```bash
   node test-email-notifications.js
   ```

3. **Check Logs**
   - Backend console will show email sending status
   - Look for SMTP errors or authentication failures

### Gmail Blocking Emails

1. Enable 2-Step Verification
2. Use App Password (not regular password)
3. Check "Less secure app access" if needed
4. Verify sender email is authorized

### Emails Going to Spam

1. Set up SPF/DKIM records for your domain
2. Use a reputable SMTP service
3. Avoid spam trigger words
4. Include unsubscribe link (future)

---

## Future Enhancements

### Phase 10.1.2 Completed ✅
- [x] Monthly report reminders
- [x] Budget alerts
- [x] Financial health alerts

### Future Features
- [ ] Email preferences management
- [ ] Unsubscribe functionality
- [ ] Email notification scheduling
- [ ] Weekly digest emails
- [ ] Achievement celebration emails
- [ ] Goal milestone notifications
- [ ] Email templates customization
- [ ] Multi-language support

---

## Code Files

### New Files Created
- `backend/utils/emailService.js` - Email sending functions (expanded)
- `backend/routes/notifications.js` - Notification API endpoints
- `backend/test-email-notifications.js` - Test script

### Modified Files
- `backend/server.js` - Added notifications route

---

## Testing Checklist

- [x] SMTP configuration verified
- [x] Monthly report reminder email tested
- [x] Budget alert (warning) tested
- [x] Budget alert (over budget) tested
- [x] Low health score alert tested
- [x] No emergency fund alert tested
- [x] High debt alert tested
- [x] Overspending alert tested
- [x] Low savings rate alert tested
- [ ] Mobile responsiveness verified
- [ ] Spam score checked
- [ ] Links functionality verified

---

## Support

For questions or issues with email notifications:
1. Check this documentation
2. Review backend console logs
3. Test with `test-email-notifications.js`
4. Verify SMTP configuration
5. Contact support if issues persist

---

**Last Updated:** November 24, 2025  
**Feature Status:** ✅ Complete and Ready for Testing
