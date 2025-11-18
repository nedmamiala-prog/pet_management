const Notification = require('../Queries/notificationQueries');

exports.NotificationCreate = (req, res) => {
  const user_id = req.user.user_id; 
  const { message } = req.body;
  const status = "unread"; 

  Notification.create(user_id, message, status, (err, result) => {
    if (err) {
      console.error("Notification insert error:", err);
      return res.status(500).json({ message: "Error creating notification", error: err });
    }

    res.status(201).json({
      message: "Notification created successfully",
      Notification: {
        notification_id: result.insertId,
        user_id,
        message,
        status
      }
    });
  });
};

exports.GetUserNotifications = (req, res) => {
  const user_id = req.user.user_id;
  Notification.getUserNotification (user_id,(err, result) =>{
    if(err) {
      console.error("User notification fetch error: ", err);
      return res.status(500).json({message: "Error fetching user notifications", error: err});
    }
    res.status(200).json({
      message: "User  notification fetch successfully",
      notifications: result,

    })
  })
}
