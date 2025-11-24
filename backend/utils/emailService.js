const nodemailer = require('nodemailer');

let transporter;

const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  SMTP settings are not fully configured. Password reset emails will be skipped.');
    return null;
  }

  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const buildSender = () => {
  const name = process.env.MAIL_FROM_NAME || 'SaveMate';
  const email = process.env.MAIL_FROM_EMAIL || 'no-reply@savemate.app';
  return `${name} <${email}>`;
};

const sendPasswordResetEmail = async ({ to, resetLink, firstName }) => {
  const transport = getTransporter();

  if (!transport) {
    console.warn(`Skipping password reset email to ${to}; SMTP not configured.`);
    return;
  }

  const subject = 'Reset your SaveMate password';
  const safeName = firstName || 'there';

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2>Hi ${safeName},</h2>
      <p>You requested to reset your SaveMate account password. Click the button below to choose a new one.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}"
           style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetLink}</p>
      <p>This link will expire soon for your security. If you did not request this, you can safely ignore this email.</p>
      <p>Stay on top of your finances,<br/>The SaveMate Team</p>
    </div>
  `;

  const text = `Hi ${safeName},\n\n` +
    `You requested to reset your SaveMate password. Use the link below to choose a new one.\n\n` +
    `${resetLink}\n\n` +
    `If you did not request this, you can ignore this email. The link expires shortly for your security.\n\n` +
    `— The SaveMate Team`;

  await transport.sendMail({
    from: buildSender(),
    to,
    subject,
    text,
    html,
  });
};

const sendMonthlyReportReminder = async ({ to, firstName, lastReportMonth }) => {
  const transport = getTransporter();

  if (!transport) {
    console.warn(`Skipping monthly report reminder to ${to}; SMTP not configured.`);
    return;
  }

  const subject = 'Monthly Financial Report Available for Review';
  const safeName = firstName || 'there';
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const uniqueId = Date.now();

  const html = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <tr>
              <td style="padding: 32px 32px 24px 32px; border-bottom: 3px solid #0f172a;">
                <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">SaveMate</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Dear ${safeName},</p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Your monthly financial report for <strong>${currentMonth}</strong> is now available for review.</p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 12px 0; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Regular review of your financial data helps you:</p>
                <ul style="line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px; color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <li>Monitor spending patterns and trends</li>
                  <li>Identify opportunities for optimization</li>
                  <li>Track progress toward financial goals</li>
                  <li>Make informed decisions about your finances</li>
                </ul>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="padding: 24px 0;">
                      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/monthly-report" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">View Monthly Report</a>
                    </td>
                  </tr>
                </table>
                ${lastReportMonth ? `<p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Last report reviewed: ${lastReportMonth}</p>` : ''}
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px; border-top: 1px solid #e2e8f0;">
                  <tr>
                    <td style="padding-top: 24px;">
                      <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Best regards,<br/><strong>The SaveMate Team</strong></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">This is an automated notification from SaveMate Financial Management System.</p>
                <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px;">Ref: MR-${uniqueId}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `Dear ${safeName},\n\n` +
    `Your monthly financial report for ${currentMonth} is now available for review.\n\n` +
    `Regular review of your financial data helps you monitor spending patterns, identify opportunities for optimization, track progress toward goals, and make informed financial decisions.\n\n` +
    `View your report: ${process.env.CLIENT_URL || 'http://localhost:3000'}/monthly-report\n\n` +
    `${lastReportMonth ? `Last report reviewed: ${lastReportMonth}\n\n` : ''}` +
    `Best regards,\nThe SaveMate Team\n\n` +
    `Ref: MR-${uniqueId}`;

  await transport.sendMail({
    from: buildSender(),
    to,
    subject,
    text,
    html,
    headers: {
      'X-Entity-Ref-ID': `monthly-report-${uniqueId}`,
    },
  });
};

const sendBudgetAlert = async ({ to, firstName, category, spent, budget, percentageUsed }) => {
  const transport = getTransporter();

  if (!transport) {
    console.warn(`Skipping budget alert to ${to}; SMTP not configured.`);
    return;
  }

  const safeName = firstName || 'there';
  const isOverBudget = percentageUsed > 100;
  const alertLevel = isOverBudget ? 'exceeded' : percentageUsed >= 90 ? 'approaching limit' : 'nearing threshold';
  const alertColor = isOverBudget ? '#dc2626' : percentageUsed >= 90 ? '#f59e0b' : '#eab308';
  const statusText = isOverBudget ? 'OVER BUDGET' : percentageUsed >= 90 ? 'BUDGET WARNING' : 'BUDGET NOTICE';
  const subject = `Budget Alert: ${category} - ${statusText}`;
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="padding: 32px 24px 24px 24px; background-color: #ffffff; border-bottom: 3px solid #0f172a;">
        <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">SaveMate</h1>
      </div>
      
      <div style="padding: 32px 24px; background-color: #ffffff;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${safeName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          This is an automated notification regarding your budget for <strong>${category}</strong>. 
          You have ${alertLevel} your allocated budget for this category.
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-left: 4px solid ${alertColor}; margin: 24px 0;">
          <tr>
            <td style="padding: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569; font-size: 15px;">Amount Spent:</td>
                  <td align="right" style="padding: 8px 0; font-size: 20px; font-weight: 600; color: ${alertColor};">$${spent.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569; font-size: 15px;">Budget Allocation:</td>
                  <td align="right" style="padding: 8px 0; font-size: 20px; font-weight: 600; color: #1e293b;">$${budget.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px 0 8px 0; border-top: 2px solid #cbd5e1;"></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569; font-size: 15px;">Budget Utilization:</td>
                  <td align="right" style="padding: 8px 0; font-size: 22px; font-weight: bold; color: ${alertColor};">${percentageUsed}%</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${isOverBudget 
          ? `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;"><strong>Recommended Actions:</strong></p>
             <ul style="line-height: 1.8; margin-bottom: 24px; color: #475569;">
               <li>Review recent transactions in ${category}</li>
               <li>Identify non-essential expenses that can be reduced</li>
               <li>Consider reallocating funds from other categories if necessary</li>
               <li>Evaluate if budget adjustment is needed for future periods</li>
             </ul>`
          : `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; padding: 16px; background-color: #f0f9ff; border-radius: 6px;">
               <strong>Remaining Balance:</strong> $${(budget - spent).toFixed(2)}<br/>
               Continue monitoring your expenses to stay within budget.
             </p>`
        }

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/expenses"
             style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
            Review Expenses
          </a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0;">
            Best regards,<br/>
            <strong>The SaveMate Team</strong>
          </p>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">This is an automated alert from SaveMate Financial Management System.</p>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px;">Ref: BA-${uniqueId}</p>
      </div>
    </div>
  `;

  const text = `Dear ${safeName},\n\n` +
    `This is an automated notification regarding your budget for ${category}. You have ${alertLevel} your allocated budget.\n\n` +
    `BUDGET SUMMARY\n` +
    `Amount Spent: $${spent.toFixed(2)}\n` +
    `Budget Allocation: $${budget.toFixed(2)}\n` +
    `Budget Utilization: ${percentageUsed}%\n\n` +
    `${isOverBudget 
      ? 'RECOMMENDED ACTIONS:\n- Review recent transactions\n- Identify non-essential expenses to reduce\n- Consider reallocating funds from other categories\n- Evaluate if budget adjustment is needed\n\n' 
      : `Remaining Balance: $${(budget - spent).toFixed(2)}\nContinue monitoring your expenses to stay within budget.\n\n`}` +
    `Review your expenses: ${process.env.CLIENT_URL || 'http://localhost:3000'}/expenses\n\n` +
    `Best regards,\nThe SaveMate Team\n\n` +
    `Ref: BA-${uniqueId}`;

  await transport.sendMail({
    from: buildSender(),
    to,
    subject,
    text,
    html,
    headers: {
      'X-Entity-Ref-ID': `budget-alert-${uniqueId}`,
      'Message-ID': `<budget-${uniqueId}@savemate.app>`,
    },
  });
};

const sendFinancialHealthAlert = async ({ to, firstName, alertType, details }) => {
  const transport = getTransporter();

  if (!transport) {
    console.warn(`Skipping financial health alert to ${to}; SMTP not configured.`);
    return;
  }

  const safeName = firstName || 'there';
  const uniqueId = Date.now() + Math.floor(Math.random() * 10000);
  
  // Define alert configurations
  const alertConfigs = {
    'low-health-score': {
      subject: 'Financial Health Alert: Score Requires Attention',
      color: '#dc2626',
      severity: 'HIGH PRIORITY',
      message: `Our analysis indicates your financial health score has decreased to <strong>${details.score}/100</strong>, which requires immediate attention.`,
      recommendations: [
        'Conduct a comprehensive review of recent spending patterns',
        'Establish or strengthen emergency fund reserves',
        'Prioritize reduction of high-interest debt obligations',
        'Develop and implement a structured budget framework'
      ]
    },
    'no-emergency-fund': {
      subject: 'Financial Health Alert: Emergency Fund Status',
      color: '#f59e0b',
      severity: 'ACTION REQUIRED',
      message: 'Our records indicate insufficient emergency fund reserves. Financial advisors recommend maintaining 3-6 months of essential expenses in liquid savings.',
      recommendations: [
        'Establish initial reserve target of $500-$1,000',
        'Progress toward 3-6 months of expenses coverage',
        'Configure automatic monthly transfers to dedicated savings account',
        'Identify discretionary expenses that can be redirected to savings'
      ]
    },
    'high-debt': {
      subject: 'Financial Health Alert: Debt-to-Income Ratio',
      color: '#dc2626',
      severity: 'HIGH PRIORITY',
      message: `Your current debt-to-income ratio of <strong>${details.debtToIncomeRatio}%</strong> exceeds recommended financial guidelines.`,
      recommendations: [
        'Prioritize repayment of highest-interest debt obligations',
        'Evaluate debt consolidation opportunities for improved terms',
        'Implement temporary hold on new debt acquisition',
        'Develop comprehensive debt reduction strategy with timeline'
      ]
    },
    'overspending': {
      subject: 'Financial Health Alert: Spending Pattern Analysis',
      color: '#f59e0b',
      severity: 'ATTENTION REQUIRED',
      message: `Analysis shows expenditures exceeding income for ${details.consecutiveMonths} consecutive months, indicating unsustainable spending pattern.`,
      recommendations: [
        'Implement detailed expense tracking for complete visibility',
        'Review and eliminate recurring charges for unused services',
        'Establish category-based spending limits with monitoring',
        'Explore opportunities for income enhancement or supplementation'
      ]
    },
    'low-savings-rate': {
      subject: 'Financial Health Alert: Savings Rate Review',
      color: '#eab308',
      severity: 'RECOMMENDATION',
      message: `Your current savings rate of <strong>${details.savingsRate}%</strong> falls below the recommended 20% benchmark established by financial planning experts.`,
      recommendations: [
        'Review 50/30/20 budgeting framework for optimal allocation',
        'Configure automatic savings transfers to ensure consistency',
        'Reduce discretionary expenditures in non-essential categories',
        'Investigate opportunities for income growth or optimization'
      ]
    }
  };

  const config = alertConfigs[alertType] || alertConfigs['low-health-score'];

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="padding: 32px 24px 24px 24px; background-color: #ffffff; border-bottom: 3px solid #0f172a;">
        <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">SaveMate</h1>
      </div>
      
      <div style="padding: 32px 24px; background-color: #ffffff;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${safeName},</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid ${config.color}; padding: 16px 20px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 600; color: ${config.color}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${config.severity}
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          ${config.message}
        </p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 6px; margin: 24px 0;">
          <p style="font-weight: 600; margin-bottom: 16px; color: #1e293b; font-size: 16px;">Recommended Actions:</p>
          <ul style="line-height: 2; margin: 0; padding-left: 20px; color: #475569;">
            ${config.recommendations.map(tip => `<li style="margin-bottom: 8px;">${tip}</li>`).join('')}
          </ul>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 3px solid #3b82f6;">
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1e40af;">
            <strong>Note:</strong> Consistent implementation of small improvements typically yields significant long-term financial benefits. Regular monitoring and adjustment of financial strategies is recommended.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/monthly-report"
             style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
            View Financial Report
          </a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0;">
            Best regards,<br/>
            <strong>The SaveMate Team</strong>
          </p>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">This is an automated financial health alert from SaveMate Financial Management System.</p>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 11px;">Ref: FH-${uniqueId}</p>
      </div>
    </div>
  `;

  const text = `Dear ${safeName},\n\n` +
    `${config.severity}\n\n` +
    `${config.message.replace(/<strong>/g, '').replace(/<\/strong>/g, '')}\n\n` +
    `RECOMMENDED ACTIONS:\n` +
    config.recommendations.map((tip, i) => `${i + 1}. ${tip}`).join('\n') + '\n\n' +
    `Note: Consistent implementation of small improvements typically yields significant long-term financial benefits. Regular monitoring and adjustment of financial strategies is recommended.\n\n` +
    `View your financial report: ${process.env.CLIENT_URL || 'http://localhost:3000'}/monthly-report\n\n` +
    `Best regards,\nThe SaveMate Team\n\n` +
    `Ref: FH-${uniqueId}`;

  await transport.sendMail({
    from: buildSender(),
    to,
    subject: config.subject,
    text,
    html,
    headers: {
      'X-Entity-Ref-ID': `financial-health-${uniqueId}`,
      'Message-ID': `<health-${uniqueId}@savemate.app>`,
    },
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendMonthlyReportReminder,
  sendBudgetAlert,
  sendFinancialHealthAlert,
};
