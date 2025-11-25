const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'bsikxgzswvq6cuilxepq-mysql.services.clever-cloud.com',
  user: process.env.DB_USER || 'udcszrxc1am7pjg7',
  password: process.env.DB_PASSWORD || 'y1mPvotifcvLJcba0o5a',
  database: process.env.DB_NAME || 'bsikxgzswvq6cuilxepq',
  port: process.env.DB_PORT || 3306
});



db.connect((err) => {
  if (err) {
    console.error(" Database connection failed:", err);
  } else {
    console.log(" Connected to MySQL (Clever Cloud)");
  }
});

module.exports = db;


      


