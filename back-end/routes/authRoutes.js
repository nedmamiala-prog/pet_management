const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post("/register", authController.register);
router.post("/login", authController.login);


router.get("/auth/google", authController.googleAuth);
router.get("/auth/google/callback", authController.googleCallback);

module.exports = router;