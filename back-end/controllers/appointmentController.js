const Appointment = require('../Queries/appointmentQueries');
const Billing = require('../Queries/billingQueries');
const Pet = require('../Queries/petQueries');
const {
  scheduleAppointmentReminders,
  notifyAppointmentStatus,
  schedulePaymentDueNotification,
  cancelScheduledReminders,
} = require('../services/notificationService');

const createAppointmentRecord = (params) =>
  new Promise((resolve, reject) => {
    Appointment.create(...params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const getPetById = (pet_id) =>
  new Promise((resolve) => {
    if (!pet_id) return resolve(null);
    Pet.getById(pet_id, (err, rows) => {
      if (err || !rows?.length) return resolve(null);
      resolve(rows[0]);
    });
  });

const createBillingRecord = (payload) =>
  new Promise((resolve, reject) => {
    Billing.create(payload, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const getAppointmentById = (appointment_id) =>
  new Promise((resolve, reject) => {
    Appointment.getById(appointment_id, (err, rows) => {
      if (err) return reject(err);
      resolve(rows?.[0] || null);
    });
  });

exports.AppointmentCreate = async (req, res) => {
  const user_id = req.user.id;
  const { pet_id, service, date_time, notes } = req.body;
  const status = 'Pending';

  if (!pet_id || !service || !date_time) {
    return res.status(400).json({ message: "Missing required appointment fields" });
  }

  try {
    const appointmentResult = await createAppointmentRecord([user_id, pet_id, date_time, service, notes, status]);
    const appointment_id = appointmentResult.insertId;
    const service_price = appointmentResult.service_price || 0;

    const pet = await getPetById(pet_id);
    const pet_name = pet?.pet_name || null;

    try {
      await scheduleAppointmentReminders({
        user_id,
        appointment_id,
        date_time,
        service_name: service,
        pet_name,
      });
    } catch (reminderErr) {
      console.error('Failed to schedule reminders:', reminderErr);
    }

    if (service_price > 0) {
      try {
        await createBillingRecord({
          appointment_id,
          user_id,
          amount: service_price,
          due_date: date_time,
          notes: `Service: ${service}`,
        });

        await schedulePaymentDueNotification({
          user_id,
          appointment_id,
          amount: service_price,
          date_time,
        });
      } catch (billingErr) {
        console.error('Billing creation error:', billingErr);
      }
    }

    res.status(201).json({
      message: "Appointment added successfully",
      appointment: {
        appointment_id,
        user_id,
        pet_id,
        service,
        date_time,
        notes: notes || null,
        status,
        service_price,
      },
    });
  } catch (err) {
    console.error("Appointment error:", err);
    res.status(500).json({
      message: "Error adding appointment",
      error: err,
    });
  }
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

exports.AppointmentGetAll = (req, res) => {
  Appointment.getAll((err, result) => {
    if (err) {
      console.error('Appointment display error: ', err);
      return res.status(500).json({ message: "Error fetching appointment", error: err });
    }

    res.status(200).json({
      message: "Appointment fetch successfully",
      appointments: result,
    });
  });
};

exports.AcceptAppointment = async (req, res) => {
  const appointment_id = req.body.appointment_id;

  if (!appointment_id) {
    return res.status(400).json({ success: false, message: "Appointment ID is required" });
  }

  try {
    await new Promise((resolve, reject) => {
      Appointment.acceptAppointment(appointment_id, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    try {
      const appointment = await getAppointmentById(appointment_id);
      if (appointment) {
        await notifyAppointmentStatus({
          user_id: appointment.user_id,
          appointment_id,
          status: 'Accepted',
          initiator: 'admin',
          pet_name: appointment.pet_name,
          service_name: appointment.service_name || appointment.service,
          date_time: appointment.date_time,
        });
      }
    } catch (notifyErr) {
      console.error('Accept notification error:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: "Appointment accepted successfully",
    });
  } catch (err) {
    console.error('Accepting appointment error:', err);
    res.status(500).json({
      success: false,
      message: "Error accepting appointment",
      error: err,
    });
  }
};

exports.CancelAppointment = async (req, res) => {
  const appointment_id = req.params.appointmentId;
  const { reason } = req.body || {};
  const requesterRole = req.user.role || 'user';
  const requesterId = req.user.id;

  if (!appointment_id) {
    return res.status(400).json({ success: false, message: "Appointment ID is required" });
  }

  try {
    const appointment = await getAppointmentById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (requesterRole !== 'admin' && appointment.user_id !== requesterId) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this appointment" });
    }

    await new Promise((resolve, reject) => {
      Appointment.cancelAppointment(appointment_id, reason || null, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    try {
      await cancelScheduledReminders(appointment_id);
    } catch (cancelReminderErr) {
      console.error('Cancel reminders error:', cancelReminderErr);
    }

    Billing.voidByAppointment(appointment_id, (billingErr) => {
      if (billingErr) {
        console.error('Void billing error:', billingErr);
      }
    });

    try {
      await notifyAppointmentStatus({
        user_id: appointment.user_id,
        appointment_id,
        status: 'Cancelled',
        reason,
        initiator: requesterRole === 'admin' ? 'admin' : 'user',
        pet_name: appointment.pet_name,
        service_name: appointment.service_name || appointment.service,
        date_time: appointment.date_time,
      });
    } catch (notifyErr) {
      console.error('Cancel notification error:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: err,
    });
  }
};

exports.UserPet = (req, res) => {
  const user_id = req.user.id;

  Appointment.userPet(user_id, (err, result) => {
    if (err) {
      console.error('User pet fetch error:', err);
      return res.status(500).json({
        success: false,
        message: "Error fetching user pets",
        error: err,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User pets fetched successfully",
      pets: result,
    });
  });
};