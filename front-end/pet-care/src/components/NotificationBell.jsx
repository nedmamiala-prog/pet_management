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
            <span className="notif-badge">
            
            </span>
          )}
        </div>
      </button>

      {showNotificationPanel && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: '120%',
            right: 0,
            width: '280px',
            maxHeight: '320px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            padding: 0,
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
              color: '#fff',
              padding: '10px 12px',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Notifications
          </div>

          {notificationLoading && (
            <div style={{ padding: '10px 12px', fontSize: '13px', color: '#666' }}>
              Loading notifications...
            </div>
          )}

          {!notificationLoading && notifications.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '13px', color: '#666' }}>
              No notifications yet.
            </div>
          )}

          {!notificationLoading &&
            notifications.length > 0 &&
            notifications.map((n) => (
              <div
                key={n._id || n.id}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f3f3',
                  fontSize: '13px',
                  cursor: 'default',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                  {n.title || 'Notification'}
                </div>
                <div style={{ color: '#555' }}>{n.message}</div>
                {n.createdAt && (
                  <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
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


