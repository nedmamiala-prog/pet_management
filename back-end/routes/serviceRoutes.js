const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const middleware = require('../middleware/authToken');

router.get('/all', middleware.verifyToken, serviceController.getAllServices);
router.get('/slots', middleware.verifyToken, serviceController.getAvailableSlots);

module.exports = router;

