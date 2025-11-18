const Appointment = require('../Queries/appointmentQueries');

exports.AppointmentCreate = (req, res) => {
  const user_id = req.user.id; 
  const pet_id = req.body.pet_id;
  const { service, date_time, notes } = req.body;
  const status = 'Pending';
  
  
 
  Appointment.create(user_id, pet_id, date_time, service, notes, status,  (err, result) => {
    if (err) {
      console.error("Appointment error:", err);
      return res.status(500).json({
        message: "Error adding appointment",
        error: err
      });
    }

    res.status(201).json({
      message: "Appointment added successfully",
      appointment: {
        appointment_id: result.insertId,
        user_id,
        pet_id,
        service,
        date_time,
        notes: notes || null,
        status
      }
    });
  });
};

exports.AppointmentGetByUser = (req, res) => {
  const user_id = req.user.id;

  Appointment.getByUser(user_id, (err, result) => {
    if (err) {
      console.error('Appointment display error:', err);
      return res.status(500).json({ message: "Error fetching user appointment", error: err });
    }

    res.status(200).json({
      message: "Appointment fetched successfully",
      appointments: result, 
    });
  });
};

exports.AppointmentGetAll =  (req, res) => {
  
  Appointment.getAll ((err, result) =>{
    if (err) {
      console.error('Appointment display error: ', err);
      return res.status(500).json({message: "Error fetching appointment", error: err});
    }

    res.status(200).json({
      message: "Appointment fetch successfully",
      appointments: result,
    });
  });
};

 exports.AcceptAppointment = (req, res) => {
 const appointment_id = req.body.appointment_id;
 
 Appointment.acceptAppointment(appointment_id, (err, result) =>{
  if (err) {
    console.error('Accepting appointment error:', err);
    return res.status(500).json({  
      success: false, 
      message: "Error accepting appointment", 
      error: err 
    });
  }

  res.status(200).json({
    success: true,
    message: "Appointment accepted successfully",
    appointment: result, 
  });
});
 
 }

 exports.UserPet = (req, res) => {
  const user_id = req.user.id;

  Appointment.userPet(user_id, (err, result) => {
    if (err) {
      console.error('User pet fetch error:', err);
      return res.status(500).json({
        success: false,
        message: "Error fetching user pets",
        error: err
      });
    }

    return res.status(200).json({
      success: true,
      message: "User pets fetched successfully",
      pets: result
    });
  });
};