const Notification = require('../Queries/notificationQueries');

exports.createNotification = (req, res) => {
  const user_id = req.user.id;
  const { message, type = 'info' } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: "Notification message is required" });
  }

  Notification.create({ user_id, message, type, status: 'unread' }, (err, result) => {
    if (err) {
      console.error("Notification insert error:", err);
      return res.status(500).json({ success: false, message: "Error creating notification", error: err });
    }

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: {
        notification_id: result.insertId,
        user_id,
        message,
        type,
        status: 'unread'
      }
    });
  });
};

exports.getUserNotifications = (req, res) => {
  const user_id = req.user.id;

  Notification.getUserNotification(user_id, (err, result) => {
    if (err) {
      console.error("User notification fetch error:", err);
      return res.status(500).json({ success: false, message: "Error fetching user notifications", error: err });
    }

    res.status(200).json({
      success: true,
      message: "User notification fetch successfully",
      notifications: result
    });
  });
};
