import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getUserAppointment } from '../api/appointmentApi'; 
import './profile.css';

function AppointmentSection() {
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const user_id = localStorage.getItem('user_id');
        const data = await getUserAppointment(user_id);
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

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
          className={`tab ${activeTab === 'canceled' ? 'active' : ''}`}
          onClick={() => handleTabClick('canceled')}
        >
          Canceled
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
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
