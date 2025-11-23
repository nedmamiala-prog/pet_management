const db = require('../config/db');

const PetRecord = {
  create: (pet_id, service_type, data, callback) => {
    const sql = "INSERT INTO pet_record (pet_id, service_type, record_data, created_at) VALUES (?, ?, ?, NOW())";
    const recordData = JSON.stringify(data);
    db.query(sql, [pet_id, service_type, recordData], callback);
  },

  getByPet: (pet_id, callback) => {
    const sql = `SELECT record_id, pet_id, service_type, record_data, created_at 
                 FROM pet_record 
                 WHERE pet_id = ? 
                 ORDER BY created_at DESC`;
    db.query(sql, [pet_id], callback);
  },

  getById: (record_id, callback) => {
    const sql = "SELECT * FROM pet_record WHERE record_id = ?";
    db.query(sql, [record_id], callback);
  },

  update: (record_id, service_type, data, callback) => {
    const sql = "UPDATE pet_record SET service_type = ?, record_data = ?, updated_at = NOW() WHERE record_id = ?";
    const recordData = JSON.stringify(data);
    db.query(sql, [service_type, recordData, record_id], callback);
  },

  delete: (record_id, callback) => {
    const sql = "DELETE FROM pet_record WHERE record_id = ?";
    db.query(sql, [record_id], callback);
  },

  getAll: (callback) => {
    const sql = `SELECT pr.*, p.pet_name, p.species, p.breed, p.gender, p.birthdate,
                 u.first_name, u.last_name, u.email
                 FROM pet_record pr
                 JOIN pet p ON pr.pet_id = p.pet_id
                 JOIN user u ON p.user_id = u.user_id
                 ORDER BY pr.created_at DESC`;
    db.query(sql, callback);
  }
};

module.exports = PetRecord;

