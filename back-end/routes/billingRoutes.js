const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const middleware = require('../middleware/authToken');

router.get('/user', middleware.verifyToken, billingController.getUserBilling);
router.get('/all', middleware.verifyToken, billingController.getAllBilling);
router.patch('/:billingId/pay', middleware.verifyToken, billingController.markAsPaid);

module.exports = router;

