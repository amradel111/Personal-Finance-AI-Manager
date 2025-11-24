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

module.exports = {
  sendPasswordResetEmail,
};
