const Notification = require('../Queries/notificationQueries');
const NotificationSchedule = require('../Queries/notificationScheduleQueries');
const User = require('../Queries/UserQueries');
const { sendEmail, isConfigured: emailConfigured } = require('./emailService');

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

const describeAppointment = ({ pet_name, service_name }) => {
  if (service_name && pet_name) return `${service_name} for ${pet_name}`;
  if (service_name) return service_name;
  if (pet_name) return `your pet ${pet_name}`;
  return 'your appointment';
};

const summarizeRecordData = (data = {}) => {
  if (!data || typeof data !== 'object') return '';
  const summaryFields = [
    ['diagnosis', 'Diagnosis'],
    ['status', 'Status'],
    ['medication', 'Medication'],
    ['notes', 'Notes'],
    ['vaccineType', 'Vaccine'],
    ['groomType', 'Grooming'],
    ['reminderType', 'Reminder'],
  ];

  const parts = summaryFields
    .map(([key, label]) => (data[key] ? `${label}: ${data[key]}` : null))
    .filter(Boolean);

  if (!parts.length) return '';
  return ` ${parts.slice(0, 2).join(' | ')}`;
};

const EMAIL_SUPPORTED_TYPES = new Set([
  'appointment_reminder_24h',
  'appointment_reminder_3h',
  'appointment_accepted',
  'appointment_cancelled',
  'payment_due',
  'pet_record_added',
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

const getUserEmail = (user_id) =>
  new Promise((resolve) => {
    if (!user_id) return resolve(null);
    User.findById(user_id, (err, rows) => {
      if (err || !rows || rows.length === 0) {
        if (err) {
          console.error('User lookup error (Email):', err);
        }
        return resolve(null);
      }
      resolve((rows && rows[0] && rows[0].email) || null);
    });
  });

const getEmailSubjectForType = (type) => {
  if (type === 'appointment_reminder_24h' || type === 'appointment_reminder_3h') {
    return 'Appointment Reminder';
  }
  if (type === 'appointment_accepted') {
    return 'Appointment Accepted';
  }
  if (type === 'appointment_cancelled') {
    return 'Appointment Cancelled';
  }
  if (type === 'payment_due') {
    return 'Payment Due';
  }
  if (type === 'pet_record_added') {
    return 'Pet Record Update';
  }
  return 'Notification';
};

const maybeSendEmail = async (user_id, type, message) => {
  console.log('maybeSendEmail called:', { user_id, type, message: message?.substring(0, 50) + '...' });
  console.log('Email configured:', emailConfigured);
  console.log('Type supported:', EMAIL_SUPPORTED_TYPES.has(type));
  
  if (!emailConfigured) {
    console.log('Email service not configured - skipping email');
    return;
  }
  if (!EMAIL_SUPPORTED_TYPES.has(type)) {
    console.log('Notification type not supported for email:', type);
    return;
  }

  try {
    const email = await getUserEmail(user_id);
    console.log('Retrieved user email:', email);
    if (!email) {
      console.log('No email found for user:', user_id);
      return;
    }
    const subject = getEmailSubjectForType(type);
    console.log('Sending email:', { to: email, subject });
    await sendEmail({ to: email, subject, text: message });
    console.log('Email dispatch completed for user:', user_id);
  } catch (err) {
    console.error('Email notification error:', err.message || err);
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
          await maybeSendEmail(user_id, type, message);
        } catch (emailErr) {
          console.error('Email dispatch error:', emailErr.message || emailErr);
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

const notifyAppointmentStatus = async ({
  user_id,
  appointment_id,
  status,
  reason,
  initiator = 'system',
  pet_name,
  service_name,
  date_time,
}) => {
  const type =
    status === 'Accepted'
      ? 'appointment_accepted'
      : status === 'Cancelled'
        ? 'appointment_cancelled'
        : 'appointment_update';

  const appointmentDate = safeDate(date_time);
  const dateText = appointmentDate ? ` on ${formatDateTime(appointmentDate)}` : '';
  const appointmentLabel = describeAppointment({ pet_name, service_name });

  let message;
  if (status === 'Accepted') {
    message = `Your ${appointmentLabel}${dateText} has been accepted.`;
  } else if (status === 'Cancelled') {
    const reasonText = reason ? ` Reason: ${reason}.` : '';
    if (initiator === 'user') {
      message = `You cancelled ${appointmentLabel}${dateText}.${reasonText}`.trim();
    } else {
      message = `Your ${appointmentLabel}${dateText} was cancelled by the clinic.${reasonText}`.trim();
    }
  } else {
    message = `Appointment status updated to ${status} for ${appointmentLabel}${dateText}.`;
  }

  const metadata = { appointment_id, status, pet_name, service_name };
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

const notifyPetRecordAdded = async ({ user_id, pet_id, pet_name, service_type, record_id, record_data }) => {
  if (!user_id) return;
  const petLabel = pet_name || 'your pet';
  const serviceLabel = service_type || 'new record';
  const summary = summarizeRecordData(record_data);
  const message = `A new ${serviceLabel} record was added for ${petLabel}.${summary}`;

  await createImmediateNotification({
    user_id,
    type: 'pet_record_added',
    message,
    metadata: {
      pet_id,
      pet_name,
      service_type,
      record_id,
      record_data: record_data || {},
    },
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
  notifyPetRecordAdded,
  schedulePaymentDueNotification,
  createImmediateNotification,
  cancelScheduledReminders,
};

