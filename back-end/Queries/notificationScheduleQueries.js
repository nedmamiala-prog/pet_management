const db = require('../config/db');

const serializePayload = ({ message, metadata = null }) => {
  try {
    return JSON.stringify({
      message,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error('Notification schedule serialization error:', error);
    return message;
  }
};

const parsePayload = (payload) => {
  if (!payload) return { message: '', metadata: null };
  try {
    const parsed = JSON.parse(payload);
    return {
      message: parsed?.message || '',
      metadata: parsed?.metadata || null,
    };
  } catch {
    return { message: payload, metadata: null };
  }
};

const ensureScheduleTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS notification_schedule (
      schedule_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      appointment_id INT NULL,
      type VARCHAR(50) DEFAULT 'reminder',
      payload JSON NULL,
      send_at DATETIME NOT NULL,
      sent TINYINT(1) DEFAULT 0,
      sent_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_send_at (send_at),
      INDEX idx_sent (sent)
    )
  `;
  db.query(sql, (err) => {
    if (err) {
      console.error('Failed to ensure notification_schedule table:', err);
    }
  });
};

ensureScheduleTable();

const NotificationSchedule = {
  schedule: ({ user_id, appointment_id = null, type = 'reminder', message, metadata = null, send_at }, callback) => {
    if (!user_id || !message || !send_at) {
      return callback(new Error('Missing required schedule fields'));
    }

    const payload = serializePayload({ message, metadata });
    const sql = `
      INSERT INTO notification_schedule (user_id, appointment_id, type, payload, send_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [user_id, appointment_id, type, payload, send_at], callback);
  },

  getDueSchedules: (callback) => {
    const sql = `
      SELECT * FROM notification_schedule
      WHERE sent = 0 AND send_at <= NOW()
      ORDER BY send_at ASC
      LIMIT 50
    `;
    db.query(sql, (err, rows) => {
      if (err) return callback(err);
      const parsed = rows.map((row) => ({
        ...row,
        payload: parsePayload(row.payload),
      }));
      callback(null, parsed);
    });
  },

  markAsSent: (schedule_id, callback) => {
    const sql = `
      UPDATE notification_schedule
      SET sent = 1, sent_at = NOW()
      WHERE schedule_id = ?
    `;
    db.query(sql, [schedule_id], callback);
  },

  cancelByAppointment: (appointment_id, callback) => {
    const sql = `
      DELETE FROM notification_schedule
      WHERE appointment_id = ? AND sent = 0
    `;
    db.query(sql, [appointment_id], callback);
  },
};

module.exports = NotificationSchedule;

