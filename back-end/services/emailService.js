const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const isConfigured = Boolean(EMAIL_USER && EMAIL_PASS);

console.log('Email service configuration check:');
console.log('EMAIL_USER:', EMAIL_USER ? 'SET' : 'NOT SET');
console.log('EMAIL_PASS:', EMAIL_PASS ? 'SET' : 'NOT SET');
console.log('Email service configured:', isConfigured);

let transporter = null;

const getTransporter = () => {
  if (!isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  console.log('sendEmail called with:', { to, subject, text: text?.substring(0, 50) + '...' });
  
  const emailTransporter = getTransporter();
  if (!emailTransporter) {
    console.log('Email transporter not available - email service not configured');
    return;
  }

  if (!to || !text) {
    console.log('Missing required fields:', { to: !!to, text: !!text });
    return;
  }

  try {
    console.log('Attempting to send email to:', to);
    await emailTransporter.sendMail({
      from: EMAIL_USER,
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
