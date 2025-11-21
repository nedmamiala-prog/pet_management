const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const middleware = require('../middleware/authToken');


router.post('/create', middleware.verifyToken, notificationController.createNotification);
router.get('/userNotification', middleware.verifyToken, notificationController.getUserNotifications);
router.put('/:notification_id/read', middleware.verifyToken, notificationController.markNotificationAsRead);
module.exports = router;
