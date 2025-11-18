const db = require('../config/db');

const Pet = {
  create: (user_id, pet_name, age, breed, gender, medical_history, callback) => {
    const sql = "INSERT INTO pet (user_id, pet_name, age, breed, gender, medical_history) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, pet_name, age, breed, gender, medical_history], callback);
  },
  getByUser: (user_id, callback) =>{
    const sql = `  SELECT pet_id, pet_name, age, breed, gender
      FROM pet 
      WHERE user_id = ? 
      ORDER BY pet_name ASC`;
    db.query(sql, [user_id], callback);
  }
};
module.exports = Pet;