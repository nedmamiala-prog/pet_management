const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const isConfigured = Boolean(EMAIL_USER && EMAIL_PASS);

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
  const emailTransporter = getTransporter();
  if (!emailTransporter) {
    return;
  }

  if (!to || !text) {
    return;
  }

  try {
    await emailTransporter.sendMail({
      from: EMAIL_USER,
      to,
      subject: subject || 'Notification',
      text,
    });
  } catch (err) {
    console.error('Email send error:', err.message || err);
  }
};

module.exports = {
  sendEmail,
  isConfigured,
};
