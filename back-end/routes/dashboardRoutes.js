const express = require('express');
const router = express.Router();
const middleware = require('../middleware/authToken');
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', middleware.verifyToken, dashboardController.getDashboardStats);

module.exports = router;

