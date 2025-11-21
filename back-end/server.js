require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('./config/schemaMigrations');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static('views'));
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const notificationsRoutes = require('./routes/notificationRoutes');
const billingRoutes = require('./routes/billingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { startNotificationScheduler } = require('./services/notificationScheduler');


app.use('/appointments', appointmentRoutes);

app.use('/pets', petRoutes);

app.use('/api', authRoutes);

app.use('/services', serviceRoutes);
app.use('/billing', billingRoutes);

app.use('/notifications', notificationsRoutes);

app.use('/analytics', analyticsRoutes);

app.use("/api/payment", require("./routes/paymentRoutes"));


app.listen(5000, () => {
  console.log('Server running on port 5000');
  startNotificationScheduler();
});
