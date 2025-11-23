const Pet = require('../Queries/petQueries');

exports.PetCreate = (req, res) => {
  const user_id = req.user.id; 
  const { pet_name, birthdate, species, breed, gender, medical_history, profile_picture } = req.body;
  
  Pet.create(user_id, pet_name, birthdate, species, breed, gender, medical_history, profile_picture, (err, result) => {
    if (err) {
      console.error("Pet insert error:", err);
      return res.status(500).json({
        message: "Error adding pet",
        error: err
      });
    }

    res.status(201).json({
      message: "Pet added successfully",
      pet: {
        pet_id: result.insertId,
        user_id
      }
    });
  });
};

exports.getUserPets = (req, res) => {
  const user_id = req.user.id;

  Pet.getByUser(user_id, (err, results) => {
    if (err) {
      console.error("Error fetching pets:", err);
      return res.status(500).json({ message: "Failed to fetch pets", error: err });
    }

    res.status(200).json({
      success: true,
      pets: results
    });
  });
};

exports.getAllPets = (req, res) => {
  Pet.getAll((err, results) => {
    if (err) {
      console.error("Error fetching all pets:", err);
      return res.status(500).json({ message: "Failed to fetch pets", error: err });
    }

    res.status(200).json({
      success: true,
      pets: results
    });
  });
};

exports.updatePetProfilePicture = (req, res) => {
  const petId = req.params.petId;
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const profile_picture_path = `/uploads/pet-profile-pictures/${req.file.filename}`;

  // First verify that the pet belongs to the user
  Pet.getById(petId, (err, petResults) => {
    if (err) {
      console.error("Error fetching pet:", err);
      return res.status(500).json({ message: "Error fetching pet", error: err });
    }
    
    if (!petResults || petResults.length === 0) {
      return res.status(404).json({ message: "Pet not found" });
    }
    
    const pet = petResults[0];
    if (pet.user_id !== userId) {
      return res.status(403).json({ message: "You can only update your own pets" });
    }

    // Update the pet's profile picture
    Pet.updateProfilePicture(petId, profile_picture_path, (err, result) => {
      if (err) {
        console.error("Pet profile picture update error:", err);
        return res.status(500).json({ message: "Error updating pet profile picture", error: err });
      }

      // Get updated pet data
      Pet.getById(petId, (findErr, updatedPetResults) => {
        if (findErr || !updatedPetResults || updatedPetResults.length === 0) {
          return res.status(500).json({ message: "Error fetching updated pet" });
        }

        const updatedPet = updatedPetResults[0];
        
        res.status(200).json({
          success: true,
          message: "Pet profile picture updated successfully",
          pet: updatedPet
        });
      });
    });
  });
};