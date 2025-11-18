import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import profile from '../assets/dp.png';
import notify from '../assets/notif.png';
import { User, Heart, Calendar, FileText, Mail, Edit2 } from 'lucide-react';
import { getUser } from '../api/authApi'; 
import UserPet from './UserPet';
import AppointmentSection from './UserAppointment';
import Notification from './Notification';
import { getUserNotifications } from '../api/notificationApi';
import BillingSection from './BillingSection';

function UserDashboard() {
  const user = getUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setNotification({
      title: 'Welcome Back!',
      message: `Hello ${user?.first_name || 'User'}! Your profile is ready.`,
      type: 'success'
    });
  }, [user?.first_name]);

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

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const showNotificationToast = (title, message, type = 'info') => {
    setNotification({ title, message, type });
  };

  const handleEditProfile = () => {
    showNotificationToast('Edit Profile', 'Profile editing feature coming soon!', 'info');
  };

  const handleNotificationClick = async () => {
    const willShow = !showNotificationPanel;
    setShowNotificationPanel(willShow);
    if (willShow) {
      await loadNotifications();
    }
  };

  const formatNotificationTitle = (type) => {
    switch (type) {
      case 'appointment_reminder_24h':
      case 'appointment_reminder_3h':
        return 'Appointment Reminder';
      case 'appointment_accepted':
        return 'Appointment Accepted';
      case 'appointment_cancelled':
        return 'Appointment Cancelled';
      case 'billing':
        return 'Billing Update';
      case 'payment_due':
        return 'Payment Reminder';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="app">
      {notification && (
        <Notification
          title={notification.title}
          message={notification.message}
          type={notification.type}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}
      
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <div className="paw-icon">🐾</div>
            </div>
            <span className="logo-text">PetCare</span>
          </div>

          <nav className="desktop-nav">
            <a href="./UserDashboard" className="nav-link">Home</a>
            <a href="./UserDashboard" className="nav-link">Services</a>
            <a href="./UserDashboard" className="nav-link">Appointment</a>
            <a href="./UserDashboard" className="nav-link">About</a>
          </nav>

          <div className="profile" style={{ position: 'relative' }}>
            <button 
              className="notify-btn"
              onClick={handleNotificationClick}
              title="View schedule notifications"
            >
              <div className="notif" style={{ backgroundImage: `url(${notify})` }}></div>
            </button>
            <div className="prof" onClick={() => navigate('/profile')} style={{ backgroundImage: `url(${profile})` }}></div>

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
                      <div key={notif.notification_id} className="notification-item">
                        <h4>{formatNotificationTitle(notif.type)}</h4>
                        <p>{notif.message}</p>
                        {notif.metadata?.reason && (
                          <p style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                            Reason: {notif.metadata.reason}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <a href="#home" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="#about" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="#services" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Services</a>
            <a href="#contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Contact</a>
            <div className="prof" onClick={() => navigate('/profile')} style={{ backgroundImage: `url(${profile})` }}></div>
          </div>
        )}
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li>
              <a href="#profile" className="active">
                <User size={20} />
                <span>Profile</span>
              </a>
            </li>
            <li>
              <a href="#pets">
                <Heart size={20} />
                <span>Pet Profile</span>
              </a>
            </li>
            <li>
              <a href="#appointments">
                <Calendar size={20} />
                <span>Appointment</span>
              </a>
            </li>
            <li>
              <a href="#records">
                <FileText size={20} />
                <span>Pet Record</span>
              </a>
            </li>
          </ul>
        </aside>

        <div className="content-area">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar" style={{ backgroundImage: `url(${profile})` }} ></div>
              <div className="profile-info">
                <h2>{user?.first_name} {user?.last_name}</h2>
                <p className="user-id">ID: {user?.id}</p>
                <p className="user-email">
                  <Mail size={16} />
                  {user?.email}
                </p>
              </div>
              <button className="btn-edit" onClick={handleEditProfile}>
                <Edit2 size={16} />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="section-title">
            <Heart size={20} />
            Registered Pets
          </div>

          <UserPet />

          <AppointmentSection/>

          <BillingSection />
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;