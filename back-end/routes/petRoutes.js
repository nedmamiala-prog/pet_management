const express = require('express');
const router = express.Router();
const middleware = require('../middleware/authToken');
const petController = require('../controllers/petController');
const multer = require('multer');
const path = require('path');

// Configure multer for pet profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/pet-profile-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pet-' + req.params.petId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post("/add", middleware.verifyToken, petController.PetCreate)
router.get('/user', middleware.verifyToken, petController.getUserPets);
router.get('/all', middleware.verifyToken, petController.getAllPets);
router.put('/:petId/profile-picture', middleware.verifyToken, upload.single('profilePicture'), petController.updatePetProfilePicture);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + error.message });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ message: 'Only image files are allowed.' });
  }
  
  next(error);
});

module.exports = router;