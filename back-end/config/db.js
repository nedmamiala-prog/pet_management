const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',        
  port: process.env.DB_PORT || 3306,               
  user: process.env.DB_USER || 'root',             
  password: process.env.DB_PASSWORD || '',        
  database: process.env.DB_NAME || 'pet_management', 
  ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : false 
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log(process.env.DB_HOST ? 
      "Connected to Clever Cloud MySQL" : 
      "Connected to MySQL (XAMPP)"
    );
  }
});

module.exports = db;
