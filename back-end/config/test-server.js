  // db.js = your MySQL connection file
  const express = require('express');
  const db = require('./db'); // your MySQL connection

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/test-db', (req, res) => {
    db.query('SELECT NOW() AS currentTime', (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, dbTime: results[0].currentTime });
    });
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
