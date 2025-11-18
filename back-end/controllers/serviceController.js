const Service = require('../Queries/serviceQueries');


exports.getAllServices = (req, res) => {
  Service.getAll((err, result) => {
    if (err) {
      console.error('Service fetch error:', err);
      return res.status(500).json({
        success: false,
        message: "Error fetching services",
        error: err
      });
    }

  
    const services = result.map(service => ({
      ...service,
      available_slots: JSON.parse(service.available_slots || '[]'),
      duration_minutes: service.duration_minutes || 30
    }));

    res.status(200).json({
      success: true,
      services: services
    });
  });
};


exports.getAvailableSlots = (req, res) => {
  const { service_name, date } = req.query;

  if (!service_name || !date) {
    return res.status(400).json({
      success: false,
      message: "Service name and date are required"
    });
  }

  Service.getAvailableSlots(service_name, date, (err, result) => {
    if (err) {
      console.error('Available slots error:', err);
      return res.status(500).json({
        success: false,
        message: "Error fetching available slots",
        error: err
      });
    }

    res.status(200).json({
      success: true,
      ...result
    });
  });
};

