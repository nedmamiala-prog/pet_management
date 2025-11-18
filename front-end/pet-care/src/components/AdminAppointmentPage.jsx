import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaClock, FaCheckCircle, FaTimesCircle, FaCalendarCheck, FaArrowLeft, FaSearch } from "react-icons/fa";
import Sidebar from "./Sidebar"; 
import Header from "./Header";    
import "./AdminAppointmentPage.css";
import { AppointmentGetAll } from "../api/appointmentApi";
import {HandleAccept} from "../api/appointmentApi";
import { getAllServices, getAvailableSlots } from "../api/serviceApi";


export default function AdminAppointmentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceSlots, setServiceSlots] = useState({}); 

useEffect(() => {
  async function fetchAllAppointments() {
    try {
      const { success, appointments, message } = await AppointmentGetAll();
      if (success) {
      
        const formattedAppointments = appointments.map(appt => ({
          id: appt.appointment_id,
          owner: `${appt.first_name} ${appt.last_name}`,
          pet: appt.pet_name,
          service: appt.service,
          date: new Date(appt.date_time).toLocaleDateString(),
          time: new Date(appt.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: appt.status
        }));
        setAppointments(formattedAppointments);
      } else {
        console.error('Failed to fetch appointments:', message);
        setError(message || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('An error occurred while loading appointments');
    } finally {
      setLoading(false);
    }
  }
  fetchAllAppointments();
}, []);


  useEffect(() => {
    async function fetchServices() {
      const response = await getAllServices();
      if (response.success) {
        setServices(response.services);
      
        const today = new Date().toISOString().split('T')[0];
        const slotsMap = {};
        for (const service of response.services) {
          const slotsResponse = await getAvailableSlots(service.service_name, today);
          if (slotsResponse.success) {
            slotsMap[service.service_name] = slotsResponse.allSlots || [];
          }
        }
        setServiceSlots(slotsMap);
      }
    }
    fetchServices();
  }, []);

  const [search, setSearch] = useState("");

  const getAvailableTimes = (service) => {
  
    return serviceSlots[service] || [];
  };

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const tabMatch = a.status === activeTab;
      if (!search.trim()) return tabMatch;
      const q = search.trim().toLowerCase();
      return tabMatch && (a.owner.toLowerCase().includes(q) || a.pet.toLowerCase().includes(q));
    });
  }, [appointments, activeTab, search]);


  const updateStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const updateTime = (id, newTime) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, time: newTime } : a));
  };

 const handleAccept = async (id) => {
  setError(null);
  setIsAccepting(true);
  try {
    const { success, message } = await HandleAccept(id);
    if (success) {
      updateStatus(id, "Accepted");
 
    } else {
      setError(message || 'Failed to accept appointment');
  
    }
  } catch (error) {
    console.error('Error accepting appointment:', error);
    setError('An error occurred while accepting the appointment');
  
  } finally {
    setIsAccepting(false);
  }
};
  const handleDecline = (id) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    updateStatus(id, "Cancelled");
  };
  const handleComplete = (id) => {
    updateStatus(id, "Completed");
  };

  return (
    <div className="grid-container-admin">
  
      {typeof Sidebar !== "undefined" && <Sidebar />}
      {typeof Header !== "undefined" && <Header />}

      <main className="main-container">
        <div className="admin-appointment-wrapper">
          <div className="top-row">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </button>
            <div className="page-title">
              <h3>Pet Care Appointments</h3>
              <h4>Manage your pet clients’ appointments and schedules</h4>
            </div>
          </div>

          <div className="controls-row">
            <div className="tabs-container">
              <button className={`tab-btn ${activeTab === "Pending" ? "active" : ""}`} onClick={() => setActiveTab("Pending")}><FaClock /> Pending</button>
              <button className={`tab-btn ${activeTab === "Accepted" ? "active" : ""}`} onClick={() => setActiveTab("Accepted")}><FaCheckCircle /> Accepted</button>
              <button className={`tab-btn ${activeTab === "Completed" ? "active" : ""}`} onClick={() => setActiveTab("Completed")}><FaCalendarCheck /> Completed</button>
              <button className={`tab-btn ${activeTab === "Cancelled" ? "active" : ""}`} onClick={() => setActiveTab("Cancelled")}><FaTimesCircle /> Cancelled</button>
            </div>

            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search owner or pet name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Loading appointments...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="appointment-table">
              <table>
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Pet</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time (select)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map(item => (
                    <tr key={item.id}>
                      <td>{item.owner}</td>
                      <td>{item.pet}</td>
                      <td>{item.service}</td>
                      <td>{item.date}</td>
                      <td>
                        <select
                          value={item.time}
                          onChange={(e) => updateTime(item.id, e.target.value)}
                          className="time-select"
                        >
                          {getAvailableTimes(item.service).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td className="actions-td">
                        {item.status === "Pending" && (
                          <>
                            <button 
                                className="accept-btn" 
                                onClick={() => handleAccept(item.id)}
                                disabled={isAccepting}
                              >
                                {isAccepting ? 'Accepting...' : 'Accept'}
                              </button>
                            <button className="decline-btn" onClick={() => handleDecline(item.id)}>Decline</button>
                          </>
                        )}
                        {item.status === "Accepted" && (
                          <>
                            <button className="complete-btn" onClick={() => handleComplete(item.id)}>Mark Completed</button>
                            <button className="decline-btn" onClick={() => handleDecline(item.id)}>Cancel</button>
                          </>
                        )}
                        {item.status === "Completed" && <span className="status completed">Done</span>}
                        {item.status === "Cancelled" && <span className="status cancelled">Cancelled</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="no-data">No {activeTab} Appointments</td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
