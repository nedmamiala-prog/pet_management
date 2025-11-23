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

  // Add birthdate and species to pet table if they don't exist
  safeQuery(`
    ALTER TABLE pet
    ADD COLUMN IF NOT EXISTS birthdate DATE NULL
  `);

  safeQuery(`
    ALTER TABLE pet
    ADD COLUMN IF NOT EXISTS species VARCHAR(50) NULL
  `);

  // Create pet_record table if it doesn't exist
  safeQuery(`
    CREATE TABLE IF NOT EXISTS pet_record (
      record_id INT AUTO_INCREMENT PRIMARY KEY,
      pet_id INT NOT NULL,
      service_type VARCHAR(100) NOT NULL,
      record_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pet (pet_id),
      FOREIGN KEY (pet_id) REFERENCES pet(pet_id) ON DELETE CASCADE
    )
  `);

  // Add profile_picture columns if they don't exist
  safeQuery(`
    ALTER TABLE user
    ADD COLUMN IF NOT EXISTS profile_picture LONGTEXT NULL
  `);

  safeQuery(`
    ALTER TABLE pet
    ADD COLUMN IF NOT EXISTS profile_picture LONGTEXT NULL
  `);
};

runMigrations();



