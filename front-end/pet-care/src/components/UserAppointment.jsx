import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getUserAppointment, cancelAppointment } from '../api/appointmentApi'; 
import './profile.css';

function AppointmentSection() {
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

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
      alert(response.message || 'Unable to cancel appointment right now.');
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
                      {['pending', 'accepted'].includes(appt.status.toLowerCase()) ? (
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
    </div>
  );
}

export default AppointmentSection;
