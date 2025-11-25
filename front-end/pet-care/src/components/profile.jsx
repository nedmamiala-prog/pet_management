import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import profile from '../assets/dp.png';
import notify from '../assets/notif.png';
import { User, Heart, Calendar, FileText, Mail, Edit2, X } from 'lucide-react';
import { getUser } from '../api/authApi'; 
import { updateUserProfile } from '../api/userApi';
import { updateProfilePicture } from '../api/profileApi';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    profilePictureFile: null
  });
  const [currentUser, setCurrentUser] = useState(user);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUser();
    setCurrentUser(userData);
    if (userData) {
      setEditFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        profilePictureFile: null
      });
      if (userData.profile_picture) {
        setProfileImagePreview(userData.profile_picture);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser?.first_name) {
      setNotification({
        title: 'Welcome Back!',
        message: `Hello ${currentUser.first_name}! Your profile is ready.`,
        type: 'success'
      });
    }
  }, [currentUser?.first_name]);

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
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotificationToast('Error', 'Image size must be less than 5MB', 'error');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showNotificationToast('Error', 'Only image files are allowed', 'error');
        return;
      }
      

      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result;
        setProfileImagePreview(previewUrl);
        setEditFormData(prev => ({
          ...prev,
          profilePictureFile: file 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {

      if (editFormData.profilePictureFile) {
        const pictureResponse = await updateProfilePicture(editFormData.profilePictureFile);
        if (!pictureResponse.success) {
          showNotificationToast('Error', pictureResponse.message || 'Failed to update profile picture', 'error');
          return;
        }
    
        if (pictureResponse.user) {
          setCurrentUser(pictureResponse.user);
        }
      }
      

      const profileData = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        phone_number: editFormData.phone_number
      };
      
      const response = await updateUserProfile(profileData);
      if (response.success) {
        setCurrentUser(response.user);
        showNotificationToast('Success', 'Profile updated successfully!', 'success');
        setShowEditModal(false);
      } else {
        showNotificationToast('Error', response.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotificationToast('Error', 'Failed to update profile. Please try again.', 'error');
    }
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
       
      

        <div className="content-area">
          <div className="profile-card">
            <div className="profile-header">
              <div 
                className="profile-avatar" 
                style={{ 
                  backgroundImage: currentUser?.profile_picture 
                    ? `url(https://pet-management-ro9c.onrender.com${currentUser.profile_picture})` 
                    : `url(${profile})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} 
              ></div>
              <div className="profile-info">
                <h2>{currentUser?.first_name} {currentUser?.last_name}</h2>
                <p className="user-id">ID: {currentUser?.id}</p>
                <p className="user-email">
                  <Mail size={16} />
                  {currentUser?.email}
                </p>
                {currentUser?.phone_number && (
                  <p className="user-phone" style={{ color: '#9ca3af', marginTop: '5px' }}>
                    📞 {currentUser.phone_number}
                  </p>
                )}
              </div>
              <button className="btn-edit" onClick={handleEditProfile}>
                <Edit2 size={16} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Edit Profile Modal */}
          {showEditModal && (
            <div className="modal-overlay" onClick={handleCloseEditModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Edit Profile</h2>
                  <button onClick={handleCloseEditModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSaveProfile}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={editFormData.first_name}
                      onChange={handleEditFormChange}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={editFormData.last_name}
                      onChange={handleEditFormChange}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone Number</label>
                    <input
                      type="text"
                      name="phone_number"
                      value={editFormData.phone_number || ''}
                      onChange={handleEditFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    {profileImagePreview && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={profileImagePreview} 
                          alt="Preview" 
                          style={{ 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '8px', 
                            objectFit: 'cover',
                            border: '2px solid #ddd'
                          }} 
                        />
                      </div>
                    )}
                  </div>
                  <div className="modal-buttons">
                    <button
                      type="button"
                      onClick={handleCloseEditModal}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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