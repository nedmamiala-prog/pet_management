const db = require('./db');

const safeQuery = (sql) => {
  db.query(sql, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
      console.error(`Schema migration failed for "${sql}":`, err.code || err);
    }
  });
};

const runMigrations = () => {
  safeQuery(`
    ALTER TABLE service
    ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0
  `);

  safeQuery(`
    ALTER TABLE appointment
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255) NULL
  `);

  safeQuery(`
    ALTER TABLE notification
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);
};

runMigrations();


