const db = require('../config/db');

const ensureBillingTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS billing (
      billing_id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('pending','paid','overdue','void') DEFAULT 'pending',
      notes VARCHAR(255) NULL,
      due_date DATETIME NULL,
      paid_at DATETIME NULL,
      payment_reference VARCHAR(100) NULL,
      paypal_order_id VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_status (status),
      INDEX idx_paypal_order_id (paypal_order_id),
      CONSTRAINT fk_billing_appointment FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id) ON DELETE CASCADE
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error('Failed to ensure billing table:', err);
    }
  });
};

ensureBillingTable();

const Billing = {
  create: ({ appointment_id, user_id, amount, status = 'pending', notes = null, due_date = null }, callback) => {
    const sql = `
      INSERT INTO billing (appointment_id, user_id, amount, status, notes, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [appointment_id, user_id, amount, status, notes, due_date], callback);
  },

  markPaid: (billing_id, payment_reference = null, callback) => {
    const sql = `
      UPDATE billing
      SET status = 'paid', paid_at = NOW(), payment_reference = ?
      WHERE billing_id = ?
    `;
    db.query(sql, [payment_reference, billing_id], callback);
  },

  setPaypalOrderId: (billing_id, paypalOrderId, callback) => {
    const sql = `
      UPDATE billing
      SET paypal_order_id = ?
      WHERE billing_id = ?
    `;
    db.query(sql, [paypalOrderId, billing_id], callback);
  },

  getByPaypalOrderId: (paypalOrderId, callback) => {
    const sql = `SELECT * FROM billing WHERE paypal_order_id = ? LIMIT 1`;
    db.query(sql, [paypalOrderId], callback);
  },

  getByUser: (user_id, callback) => {
    const sql = `
      SELECT b.*
      FROM billing b
      JOIN appointment a ON b.appointment_id = a.appointment_id
      WHERE b.user_id = ?
        AND a.status = 'Accepted'
        AND b.status != 'void'
      ORDER BY b.created_at DESC
    `;
    db.query(sql, [user_id], callback);
  },

  getByAppointment: (appointment_id, callback) => {
    const sql = `SELECT * FROM billing WHERE appointment_id = ?`;
    db.query(sql, [appointment_id], callback);
  },

  getById: (billing_id, callback) => {
    const sql = `SELECT * FROM billing WHERE billing_id = ? LIMIT 1`;
    db.query(sql, [billing_id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows && rows[0] ? rows[0] : null);
    });
  },

  voidByAppointment: (appointment_id, callback) => {
    const sql = `
      UPDATE billing
      SET status = 'void'
      WHERE appointment_id = ? AND status != 'paid'
    `;
    db.query(sql, [appointment_id], callback);
  },

  getAllWithUsers: (callback) => {
    const sql = `
      SELECT b.*, u.first_name, u.last_name, u.email
      FROM billing b
      JOIN user u ON b.user_id = u.user_id
      ORDER BY b.created_at DESC
    `;
    db.query(sql, callback);
  },
};

module.exports = Billing;

