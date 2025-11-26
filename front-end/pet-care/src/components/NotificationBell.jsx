import React, { useState, useEffect } from 'react';
import Notification from './Notification';
import notifyIcon from '../assets/notif.png';
import profileIcon from '../assets/dp.png';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications } from '../api/notificationApi';

export default function NotificationBell({ showProfileAvatar = true, showLogoutButton = false, onLogout }) {
  const [notification, setNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setNotificationLoading(true);
    const response = await getUserNotifications();
    if (response.success) {
      setNotifications(response.notifications);
    }
    setNotificationLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleNotificationClick = async () => {
    const willShow = !showNotificationPanel;
    setShowNotificationPanel(willShow);
    if (willShow) {
      await loadNotifications();
    }
  };

  return (
    <div className="profile" style={{ position: 'relative' }}>
      {notification && (
        <Notification
          title={notification.title}
          message={notification.message}
          type={notification.type}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}

      <button
        className="notify-btn"
        onClick={handleNotificationClick}
        title="View schedule notifications"
      >
        <div
          className="notif"
          style={{ backgroundImage: `url(${notifyIcon})` }}
        >
          {notifications.length > 0 && (
            <span className="notif-badge"></span>
          )}
        </div>
      </button>

      {showNotificationPanel && (
        <div className="notification-panel">
          <header>Notifications</header>
          <div className="notification-list">
            {notificationLoading ? (
              <p className="notification-empty">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-empty">You're all caught up!</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notification_id || notif._id || notif.id}
                  className="notification-item"
                >
                  <h4>{notif.title || 'Notification'}</h4>
                  <p>{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showProfileAvatar && (
        <div
          className="prof"
          onClick={() => navigate('/profile')}
          style={{ backgroundImage: `url(${profileIcon})` }}
        />
      )}

      {showLogoutButton && onLogout && (
        <button className="logout-btn" onClick={onLogout}>
          LOGOUT
        </button>
      )}
    </div>
  );
}


