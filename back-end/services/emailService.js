const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER;

const isConfigured = Boolean(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL);

console.log('Email service configuration check:');
console.log('SENDGRID_API_KEY:', SENDGRID_API_KEY ? 'SET' : 'NOT SET');
console.log('SENDGRID_FROM_EMAIL:', SENDGRID_FROM_EMAIL ? 'SET' : 'NOT SET');
console.log('Email service configured:', isConfigured);

if (isConfigured) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('SendGrid not configured — emails will be skipped.');
}

const sendEmail = async ({ to, subject, text }) => {
  console.log('sendEmail called with:', { to, subject, text: text?.substring(0, 50) + '...' });

  if (!isConfigured) {
    console.log('SendGrid api key or sender email missing — email not sent.');
    return;
  }

  if (!to || !text) {
    console.log('Missing required fields:', { to: !!to, text: !!text });
    return;
  }

  try {
    console.log('Attempting to send email to:', to);
    await sgMail.send({
      from: SENDGRID_FROM_EMAIL,
      to,
      subject: subject || 'Notification',
      text,
    });
    console.log('Email sent successfully to:', to);
  } catch (err) {
    console.error('Email send error:', err.message || err);
    console.error('Full error:', err);
  }
};

module.exports = {
  sendEmail,
  isConfigured,
};
