const NotificationSchedule = require('../Queries/notificationScheduleQueries');
const { createImmediateNotification } = require('./notificationService');

const DEFAULT_INTERVAL_MS = 60 * 1000;

const deliverDueNotifications = () => {
  NotificationSchedule.getDueSchedules((err, schedules) => {
    if (err) {
      return console.error('Failed to fetch due notification schedules:', err);
    }

    if (!schedules.length) {
      return;
    }

    schedules.forEach((schedule) => {
      const { user_id, appointment_id, type, payload } = schedule;

      createImmediateNotification({
        user_id,
        type,
        message: payload.message,
        metadata: {
          appointment_id,
          ...payload.metadata,
        },
      })
        .then(() => {
          NotificationSchedule.markAsSent(schedule.schedule_id, (markErr) => {
            if (markErr) {
              console.error('Failed to mark notification schedule as sent:', markErr);
            }
          });
        })
        .catch((createErr) => {
          console.error('Failed to create scheduled notification:', createErr);
        });
    });
  });
};

let intervalRef = null;

const startNotificationScheduler = (intervalMs = DEFAULT_INTERVAL_MS) => {
  if (intervalRef) return;
  intervalRef = setInterval(deliverDueNotifications, intervalMs);
  console.log('[NotificationScheduler] Scheduler started');
};

const stopNotificationScheduler = () => {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
    console.log('[NotificationScheduler] Scheduler stopped');
  }
};

module.exports = {
  startNotificationScheduler,
  stopNotificationScheduler,
};

