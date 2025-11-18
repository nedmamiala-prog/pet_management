const db = require('../config/db');
const Service = require('./serviceQueries');

const Appointment = {
  create: (user_id, pet_id, date_time, service, notes, status, callback) => {
 
    Service.getByName(service, (err, serviceResult) => {
      if (err) {
        return callback(err, null);
      }
      
      let service_id = null;
      if (serviceResult && serviceResult.length > 0) {
        service_id = serviceResult[0].service_id;
      }
      

      const sql = "INSERT INTO appointment (user_id, pet_id, date_time, service, service_id, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
      db.query(sql, [user_id, pet_id, date_time, service, service_id, notes || null, status], callback);
    });
  },
  getByUser: (user_id, callback) => {
    
    const sql = ` SELECT a.*, u.first_name, u.last_name, p.pet_name,
                  s.service_id, s.duration_minutes, s.description as service_description
                  FROM appointment a
                  JOIN user u ON a.user_id = u.user_id
                  JOIN pet p ON a.pet_id = p.pet_id
                  LEFT JOIN service s ON a.service_id = s.service_id
                  WHERE a.user_id = ?
  `;
    db.query(sql, [user_id], callback);
  },
  getAll: (callback) => {
   
    const sql = `SELECT a.*, u.first_name, u.last_name, u.email, u.phone_number, p.pet_name, p.breed,
                 s.service_id, s.duration_minutes, s.description as service_description
                 FROM appointment a 
                 JOIN user u ON a.user_id = u.user_id 
                 JOIN pet p ON a.pet_id = p.pet_id 
                 LEFT JOIN service s ON a.service_id = s.service_id
                 ORDER BY a.date_time DESC`;
    db.query(sql, callback);
  },

  acceptAppointment: (appointment_id, callback) => {
    const sql = `UPDATE appointment SET status = "Accepted" WHERE appointment_id = ?`;
    db.query(sql, [appointment_id], callback)
  },

  userPet: (user_id, callback) => {
    const sql = `
      SELECT 
        pet_id,
        pet_name,
        breed,
        age,
        gender,
        medical_history
      FROM pet
      WHERE user_id = ?`;
    db.query(sql, [user_id], callback);
  }
};
module.exports = Appointment;