const db = require('../config/db');

const Pet = {
  create: (user_id, pet_name, birthdate, species, breed, gender, medical_history, profile_picture, callback) => {
    const sql = "INSERT INTO pet (user_id, pet_name, birthdate, species, breed, gender, medical_history, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, pet_name, birthdate, species, breed, gender, medical_history, profile_picture || null], callback);
  },
  getByUser: (user_id, callback) =>{
    const sql = `  SELECT pet_id, pet_name, birthdate, species, breed, gender, medical_history, profile_picture
      FROM pet 
      WHERE user_id = ? 
      ORDER BY pet_name ASC`;
    db.query(sql, [user_id], callback);
  },
  getById: (pet_id, callback) => {
    const sql = "SELECT * FROM pet WHERE pet_id = ?";
    db.query(sql, [pet_id], callback);
  },
  getAll: (callback) => {
    const sql = `SELECT p.*, u.first_name, u.last_name, u.email, u.phone_number, u.profile_picture as user_profile_picture
                 FROM pet p 
                 JOIN user u ON p.user_id = u.user_id 
                 ORDER BY p.pet_name ASC`;
    db.query(sql, callback);
  },
  updateProfilePicture: (pet_id, profile_picture_path, callback) => {
    const sql = "UPDATE pet SET profile_picture = ? WHERE pet_id = ?";
    db.query(sql, [profile_picture_path, pet_id], callback);
  }
};
module.exports = Pet;