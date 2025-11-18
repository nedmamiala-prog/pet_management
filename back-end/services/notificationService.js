const Notification = require('../Queries/notificationQueries');
const NotificationSchedule = require('../Queries/notificationScheduleQueries');
const User = require('../Queries/UserQueries');
const { sendSms, isConfigured: smsConfigured } = require('./smsService');

const formatDateTime = (date) =>
  date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const safeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const SMS_SUPPORTED_TYPES = new Set([
  'appointment_reminder_24h',
  'appointment_reminder_3h',
  'appointment_accepted',
  'appointment_cancelled',
  'payment_due',
]);

const scheduleReminder = ({ user_id, appointment_id, type, send_at, message, metadata = {} }) =>
  new Promise((resolve, reject) => {
    NotificationSchedule.schedule(
      {
        user_id,
        appointment_id,
        type,
        send_at,
        message,
        metadata,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });

const getUserPhoneNumber = (user_id) =>
  new Promise((resolve) => {
    if (!user_id) return resolve(null);
    User.findById(user_id, (err, rows) => {
      if (err || !rows || rows.length === 0) {
        if (err) {
          console.error('User lookup error (SMS):', err);
        }
        return resolve(null);
      }
      resolve(rows[0].phone_number || null);
    });
  });

const maybeSendSms = async (user_id, type, message) => {
  if (!smsConfigured) return;
  if (!SMS_SUPPORTED_TYPES.has(type)) return;
  if (!message) return;

  try {
    const phone = await getUserPhoneNumber(user_id);
    if (!phone) return;
    await sendSms(phone, message);
  } catch (err) {
    console.error('SMS notification error:', err.message || err);
  }
};

const dispatchNotification = ({ user_id, type = 'info', message, metadata = {} }) =>
  new Promise((resolve, reject) => {
    Notification.create(
      {
        user_id,
        message,
        type,
        metadata,
        status: 'unread',
      },
      async (err, result) => {
        if (err) return reject(err);
        try {
          await maybeSendSms(user_id, type, message);
        } catch (smsErr) {
          console.error('SMS dispatch error:', smsErr.message || smsErr);
        }
        resolve(result);
      }
    );
  });

const createImmediateNotification = (payload) => dispatchNotification(payload);

const scheduleAppointmentReminders = async ({ user_id, appointment_id, date_time, service_name, pet_name }) => {
  const appointmentDate = safeDate(date_time);
  if (!appointmentDate) return;

  const reminders = [
    { offsetHours: 24, type: 'appointment_reminder_24h' },
    { offsetHours: 3, type: 'appointment_reminder_3h' },
  ];

  await Promise.all(
    reminders.map(async ({ offsetHours, type }) => {
      const reminderTime = new Date(appointmentDate.getTime() - offsetHours * 60 * 60 * 1000);
      if (reminderTime <= new Date()) return;

      const message = `Reminder: ${service_name} for ${pet_name || 'your pet'} on ${formatDateTime(appointmentDate)}.`;
      const metadata = { appointment_id, service_name, pet_name, appointment_date: appointmentDate };
      await scheduleReminder({ user_id, appointment_id, type, send_at: reminderTime, message, metadata });
    })
  );
};

const notifyAppointmentStatus = async ({ user_id, appointment_id, status, reason, initiator = 'system' }) => {
  const type =
    status === 'Accepted'
      ? 'appointment_accepted'
      : status === 'Cancelled'
        ? 'appointment_cancelled'
        : 'appointment_update';

  let message;
  if (status === 'Accepted') {
    message = 'Your appointment has been accepted.';
  } else if (status === 'Cancelled') {
    message =
      initiator === 'user'
        ? 'You cancelled this appointment successfully.'
        : `Your appointment was cancelled${reason ? `: ${reason}` : '.'}`;
  } else {
    message = `Appointment status updated: ${status}.`;
  }

  const metadata = { appointment_id, status };
  if (reason && initiator !== 'user') {
    metadata.reason = reason;
  }

  await createImmediateNotification({
    user_id,
    type,
    message,
    metadata,
  });
};

const notifyBillingUpdate = async ({ user_id, amount, status, invoice_id }) => {
  const message =
    status === 'paid'
      ? `Payment received for ₱${amount}. Thank you!`
      : status === 'overdue'
        ? `Payment overdue for ₱${amount}. Please settle soon.`
        : `Invoice updated: ₱${amount} is ${status}.`;

  await createImmediateNotification({
    user_id,
    type: 'billing',
    message,
    metadata: { invoice_id, amount, status },
  });
};

const notifyPaymentRequest = async ({ user_id, amount, appointment_id }) => {
  const message = `Payment of ₱${amount} is now due for your appointment.`;
  await createImmediateNotification({
    user_id,
    type: 'payment_due',
    message,
    metadata: { appointment_id, amount },
  });
};

const schedulePaymentDueNotification = async ({ user_id, appointment_id, amount, date_time }) => {
  const appointmentDate = safeDate(date_time);
  if (!appointmentDate) {
    return;
  }

  if (appointmentDate <= new Date()) {
    await notifyPaymentRequest({ user_id, amount, appointment_id });
    return;
  }

  const message = `Payment of ₱${amount} is now due for your appointment.`;
  await scheduleReminder({
    user_id,
    appointment_id,
    type: 'payment_due',
    send_at: appointmentDate,
    message,
    metadata: { appointment_id, amount },
  });
};

const cancelScheduledReminders = (appointment_id) =>
  new Promise((resolve, reject) => {
    NotificationSchedule.cancelByAppointment(appointment_id, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

module.exports = {
  scheduleAppointmentReminders,
  notifyAppointmentStatus,
  notifyBillingUpdate,
  notifyPaymentRequest,
  schedulePaymentDueNotification,
  createImmediateNotification,
  cancelScheduledReminders,
};

