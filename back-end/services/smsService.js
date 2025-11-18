const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const DEFAULT_COUNTRY_CODE = process.env.SMS_DEFAULT_COUNTRY_CODE || '+63';

let client = null;

const isConfigured = Boolean(ACCOUNT_SID && AUTH_TOKEN && FROM_NUMBER);

const getClient = () => {
  if (!isConfigured) return null;
  if (!client) {
    client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  }
  return client;
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) {
    return trimmed;
  }
  if (trimmed.startsWith('0')) {
    return `${DEFAULT_COUNTRY_CODE}${trimmed.slice(1)}`;
  }
  return `${DEFAULT_COUNTRY_CODE}${trimmed}`;
};

const sendSms = async (to, message) => {
  const smsClient = getClient();
  if (!smsClient) {
    return;
  }

  const normalized = normalizePhone(to);
  if (!normalized) return;

  try {
    await smsClient.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: normalized,
    });
  } catch (err) {
    console.error('SMS send error:', err.message || err);
  }
};

module.exports = {
  sendSms,
  isConfigured,
};

