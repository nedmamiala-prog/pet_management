require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('./config/schemaMigrations');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

app.use(express.static('views'));
app.use('/uploads', express.static('uploads'));
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const notificationsRoutes = require('./routes/notificationRoutes');
const billingRoutes = require('./routes/billingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const petRecordRoutes = require('./routes/petRecordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { startNotificationScheduler } = require('./services/notificationScheduler');


app.use('/appointments', appointmentRoutes);
app.use('/pet-records', petRecordRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/pets', petRoutes);

app.use('/api', authRoutes);

app.use('/services', serviceRoutes);
app.use('/billing', billingRoutes);

app.use('/notifications', notificationsRoutes);

app.use('/analytics', analyticsRoutes);

app.use("/api/payment", require("./routes/paymentRoutes"));

// Test database connection endpoint
app.get('/test-db', (req, res) => {
  db.query('SELECT NOW() AS currentTime, DATABASE() AS currentDatabase', (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: err.message,
        details: 'Database connection failed'
      });
    }
    res.json({ 
      success: true, 
      message: 'Database connected successfully',
      dbTime: result[0].currentTime,
      database: result[0].currentDatabase,
      host: process.env.DB_HOST || 'localhost'
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startNotificationScheduler();
});
