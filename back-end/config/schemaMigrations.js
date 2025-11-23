const db = require('./db');

const safeQuery = (sql) => {
  db.query(sql, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_PARSE_ERROR') {
      console.error(`Schema migration failed for "${sql}":`, err.code || err);
    }
  });
};

const runMigrations = () => {
  // Use safer column addition without IF NOT EXISTS
  const addColumnSafely = (table, column, definition) => {
    const checkSql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'`;
    
    db.query(checkSql, (err, result) => {
      if (!err && result.length === 0) {
        const alterSql = `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`;
        db.query(alterSql, (alterErr) => {
          if (alterErr) {
            console.error(`Failed to add ${column} to ${table}:`, alterErr.code);
          } else {
            console.log(`Added ${column} to ${table}`);
          }
        });
      }
    });
  };

  addColumnSafely('service', 'price', 'DECIMAL(10,2) DEFAULT 0');
  addColumnSafely('appointment', 'cancellation_reason', 'VARCHAR(255) NULL');
  addColumnSafely('notification', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  addColumnSafely('pet', 'birthdate', 'DATE NULL');
  addColumnSafely('pet', 'species', 'VARCHAR(50) NULL');
  addColumnSafely('user', 'profile_picture', 'LONGTEXT NULL');
  addColumnSafely('pet', 'profile_picture', 'LONGTEXT NULL');

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
};

runMigrations();



