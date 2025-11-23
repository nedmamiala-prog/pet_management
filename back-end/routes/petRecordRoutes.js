const express = require('express');
const router = express.Router();
const middleware = require('../middleware/authToken');
const petRecordController = require('../controllers/petRecordController');

router.post("/", middleware.verifyToken, petRecordController.createRecord);
router.get("/pet/:pet_id", middleware.verifyToken, petRecordController.getPetRecords);
router.get("/all", middleware.verifyToken, petRecordController.getAllRecords);
router.put("/:record_id", middleware.verifyToken, petRecordController.updateRecord);
router.delete("/:record_id", middleware.verifyToken, petRecordController.deleteRecord);

module.exports = router;

