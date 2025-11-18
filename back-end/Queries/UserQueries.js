const db = require('../config/db');

const User = {
  create: (first_name, last_name, username, email, password, phone_number, callback) => {
    const sql = "INSERT INTO user (first_name, last_name, username, email, password, phone_number) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [first_name, last_name, username, email, password, phone_number], callback);
  },
  
  findByUsername: (username, callback) =>{
  const sql = "SELECT * FROM user WHERE username = ?";
  db.query(sql, [username], callback);
},
  
  findByEmail: (email, callback) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.query(sql, [email], callback);
  },

  findById: (user_id, callback) => {
    const sql = "SELECT * FROM user WHERE user_id = ?";
    db.query(sql, [user_id], callback);
  },
  
  createGoogleUser: (first_name, last_name, email, google_id, callback) => {
    
    const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);
   
    const sql = "INSERT INTO user (first_name, last_name, username, email, password, phone_number, google_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [first_name, last_name, username, email, null, null, google_id], callback);
  }

};
module.exports = User;