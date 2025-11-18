const db = require('../config/db');

const Notification = {

  create: (user_id, message, status, callback) => {
    const sql = "INSERT INTO notification (user_id, message, status) VALUES (?, ?, ?)";
    db.query(sql, [user_id, message, status], callback);
  },

  getUserNotification: (user_id, callback) => {
    const sql = `SELECT * FROM notification WHERE user_id = ? ORDER BY created_at DESC`;
    db.query(sql, [user_id], callback);
  },

}

module.exports = Notification;