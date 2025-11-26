const db = require('../config/db');

const serializePayload = ({ message, type = 'info', metadata = null }) => {
  try {
    return JSON.stringify({
      message,
      type,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error('Notification payload serialization error:', error);
    return safeMessage.slice(0, MAX_MESSAGE_LENGTH);
  }
};

const parseRow = (row) => {
  if (!row) return row;
  let parsed;
  try {
    parsed = JSON.parse(row.message);
  } catch (error) {
    parsed = null;
  }

  return {
    ...row,
    message: parsed?.message || row.message,
    type: parsed?.type || 'info',
    metadata: parsed?.metadata || null,
  };
};

const Notification = {
  create: ({ user_id, message, status = 'unread', type = 'info', metadata = null }, callback) => {
    const payload = serializePayload({ message, type, metadata });
    const sql = "INSERT INTO notification (user_id, message, status) VALUES (?, ?, ?)";
    db.query(sql, [user_id, payload, status], callback);
  },

  bulkCreate: (notifications = [], callback) => {
    if (!notifications.length) return callback(null, []);

    const values = notifications.map((notif) => {
      const payload = serializePayload(notif);
      return [notif.user_id, payload, notif.status || 'unread'];
    });

    const sql = "INSERT INTO notification (user_id, message, status) VALUES ?";
    db.query(sql, [values], callback);
  },

  getUserNotification: (user_id, callback) => {
    const sql = `SELECT * FROM notification WHERE user_id = ? AND status = 'unread' ORDER BY created_at DESC`;
    db.query(sql, [user_id], (err, rows) => {
      if (err) return callback(err);
      const parsed = rows.map(parseRow);
      callback(null, parsed);
    });
  },

  markAsRead: (notification_id, user_id, callback) => {
    const sql = "UPDATE notification SET status = 'read' WHERE notification_id = ? AND user_id = ?";
    db.query(sql, [notification_id, user_id], callback);
  },
};

module.exports = Notification;