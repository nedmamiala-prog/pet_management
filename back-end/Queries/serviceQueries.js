const db = require('../config/db');

const Service = {
 
  getAll: (callback) => {
    const sql = `SELECT * FROM service ORDER BY service_name`;
    db.query(sql, callback);
  },


  getByName: (service_name, callback) => {
    const sql = `SELECT * FROM service WHERE service_name = ?`;
    db.query(sql, [service_name], callback);
  },


  getAvailableSlots: (service_name, date, callback) => {
  
    Service.getByName(service_name, (err, serviceResult) => {
      if (err) return callback(err, null);
      if (!serviceResult || serviceResult.length === 0) {
        return callback(null, {
          service: service_name,
          duration: 30,
          availableSlots: [],
          allSlots: []
        });
      }
      const service = serviceResult[0];
      const slots = JSON.parse(service.available_slots || '[]');
      const duration = service.duration_minutes || 30;

      
      const startOfDay = `${date} 00:00:00`;
      const endOfDay = `${date} 23:59:59`;
      
      const sql = `
        SELECT a.date_time, a.service_id
        FROM appointment a
        LEFT JOIN service s ON a.service_id = s.service_id
        WHERE (s.service_name = ? OR a.service = ?)
        AND DATE(a.date_time) = DATE(?)
        AND a.status IN ('Pending', 'Accepted')
      `;
      
      db.query(sql, [service_name, service_name, date], (err, bookedAppointments) => {
        if (err) return callback(err, null);

       
        const bookedTimes = bookedAppointments.map(apt => {
          const aptTime = new Date(apt.date_time);
          const hours = String(aptTime.getHours()).padStart(2, '0');
          const minutes = String(aptTime.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        });

       
        const availableSlots = slots.filter(slot => {
      
          let slotTime = slot;
          if (slot.includes(' ')) { 
            slotTime = slot.split(' ')[0];
          }
   
          if (slotTime.match(/^\d{1,2}:\d{2}$/)) {
            const [hours, minutes] = slotTime.split(':');
            const normalizedTime = `${String(parseInt(hours)).padStart(2, '0')}:${minutes}`;
            return !bookedTimes.includes(normalizedTime);
          }
      
          if (slot.toLowerCase().includes('anytime')) {
            return true;
          }
          return true; 
        });

        callback(null, {
          service: service_name,
          duration: duration,
          availableSlots: availableSlots,
          allSlots: slots
        });
      });
    });
  }
};

module.exports = Service;

