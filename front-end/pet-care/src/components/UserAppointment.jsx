import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getUserAppointment, cancelAppointment } from '../api/appointmentApi'; 
import './profile.css';

function AppointmentSection() {
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const fetchAppointments = async () => {
    try {
      const data = await getUserAppointment();
      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (appointment) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmCancel) return;

    setCancellingId(appointment.appointment_id);
    const response = await cancelAppointment(appointment.appointment_id, 'Cancelled by user');
    setCancellingId(null);

    if (!response.success) {
      setNotification({
        title: 'Cancellation failed',
        message: response.message || 'Unable to cancel appointment right now.',
      });
      return;
    }

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.appointment_id === appointment.appointment_id
          ? { ...appt, status: 'Cancelled' }
          : appt
      )
    );
  };

  const filteredAppointments = appointments.filter(
    (appt) => appt.status.toLowerCase() === activeTab
  );

  return (
    <div>
      <div className="section-title">
        <Calendar size={20} />
        Appointment
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabClick('pending')}
        >
          Pending
        </button>
        <button 
          className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => handleTabClick('accepted')}
        >
          Accepted
        </button>
        <button 
          className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => handleTabClick('cancelled')}
        >
          Cancelled
        </button>
      </div>

      <div className="appointments-table">
        {loading ? (
          <p>Loading appointments...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name of Pet</th>
                <th>Date & Appointment Time</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <tr key={appt.appointment_id}>
                    <td>{appt.pet_name || 'Unknown Pet'}</td>
                    <td>{new Date(appt.date_time).toLocaleString()}</td>
                    <td>{appt.service}</td>
                    <td>
                      <span className={`status-badge status-${appt.status.toLowerCase()}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {['pending'].includes(appt.status.toLowerCase()) ? (
                        <button
                          className="action-btn cancel"
                          onClick={() => handleCancel(appt)}
                          disabled={cancellingId === appt.appointment_id}
                        >
                          {cancellingId === appt.appointment_id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No {activeTab} appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {notification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: '360px',
              maxWidth: '90%',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
              padding: '20px',
            }}
          >
            <h3 style={{ marginBottom: '8px', color: '#111827' }}>{notification.title}</h3>
            <p style={{ marginBottom: '16px', color: '#4b5563', fontSize: '14px' }}>
              {notification.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setNotification(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentSection;
