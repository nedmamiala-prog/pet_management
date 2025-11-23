const PetRecord = require('../Queries/petRecordQueries');

exports.createRecord = (req, res) => {
  const { pet_id, service_type, data } = req.body;

  if (!pet_id || !service_type) {
    return res.status(400).json({ message: "Pet ID and service type are required" });
  }

  PetRecord.create(pet_id, service_type, data || {}, (err, result) => {
    if (err) {
      console.error("Pet record insert error:", err);
      return res.status(500).json({
        message: "Error adding pet record",
        error: err
      });
    }

    res.status(201).json({
      success: true,
      message: "Pet record added successfully",
      record: {
        record_id: result.insertId,
        pet_id
      }
    });
  });
};

exports.getPetRecords = (req, res) => {
  const { pet_id } = req.params;

  PetRecord.getByPet(pet_id, (err, results) => {
    if (err) {
      console.error("Error fetching pet records:", err);
      return res.status(500).json({ message: "Failed to fetch pet records", error: err });
    }

    // Parse JSON data safely
    const records = results.map(record => {
      let recordData = {};
      try {
        if (typeof record.record_data === 'string') {
          recordData = JSON.parse(record.record_data);
        } else if (record.record_data && typeof record.record_data === 'object') {
          recordData = record.record_data;
        }
      } catch (parseErr) {
        console.error("Error parsing record_data:", parseErr);
        recordData = {};
      }

      return {
        ...record,
        record_data: recordData
      };
    });

    res.status(200).json({
      success: true,
      records
    });
  });
};

exports.getAllRecords = (req, res) => {
  PetRecord.getAll((err, results) => {
    if (err) {
      console.error("Error fetching all records:", err);
      return res.status(500).json({ message: "Failed to fetch records", error: err });
    }

    // Parse JSON data safely
    const records = results.map(record => {
      let recordData = {};
      try {
        if (typeof record.record_data === 'string') {
          recordData = JSON.parse(record.record_data);
        } else if (record.record_data && typeof record.record_data === 'object') {
          recordData = record.record_data;
        }
      } catch (parseErr) {
        console.error("Error parsing record_data:", parseErr);
        recordData = {};
      }

      return {
        ...record,
        record_data: recordData
      };
    });

    res.status(200).json({
      success: true,
      records
    });
  });
};

exports.updateRecord = (req, res) => {
  const { record_id } = req.params;
  const { service_type, data } = req.body;

  PetRecord.update(record_id, service_type, data || {}, (err, result) => {
    if (err) {
      console.error("Pet record update error:", err);
      return res.status(500).json({
        message: "Error updating pet record",
        error: err
      });
    }

    res.status(200).json({
      success: true,
      message: "Pet record updated successfully"
    });
  });
};

exports.deleteRecord = (req, res) => {
  const { record_id } = req.params;

  PetRecord.delete(record_id, (err, result) => {
    if (err) {
      console.error("Pet record delete error:", err);
      return res.status(500).json({
        message: "Error deleting pet record",
        error: err
      });
    }

    res.status(200).json({
      success: true,
      message: "Pet record deleted successfully"
    });
  });
};

