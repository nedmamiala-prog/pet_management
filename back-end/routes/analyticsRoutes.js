const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const middleware = require('../middleware/authToken');

router.get('/overview', middleware.verifyToken, middleware.requireAdmin, analyticsController.getOverview);

module.exports = router;
