const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const middleware = require('../middleware/authToken');

router.post("/create", middleware.verifyToken, appointmentController.AppointmentCreate); 
router.get("/userAppointment", middleware.verifyToken, appointmentController.AppointmentGetByUser);
router.get("/allAppointment", middleware.verifyToken, appointmentController.AppointmentGetAll);
router.post('/acceptAppointment', middleware.verifyToken, appointmentController.AcceptAppointment);
router.post('/userPet', middleware.verifyToken, appointmentController.UserPet);
module.exports = router;