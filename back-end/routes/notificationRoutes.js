const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const middleware = require('../middleware/authToken');


router.post('/create', middleware.verifyToken, notificationController.NotificationCreate);
router.get('/userNotification', middleware.verifyToken, notificationController.GetUserNotifications);
module.exports = router;
