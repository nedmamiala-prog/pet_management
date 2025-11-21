import React from 'react';
import { BsCalendar, BsBarChartFill, BsJournalMedical, BsHourglassSplit } from 'react-icons/bs';
import './Admin.css';
import Sidebar from './Sidebar';
import Header from './Header';

function AdminHome() {

  // ----- STATIC SAMPLE DATA -----
  const pendingApprovals = [
    { id: 1, name: "Rinrin" },
    { id: 2, name: "Rinrin" },
  ];

  const recentActivity = [
    { id: 1, text: "Appointment approved for Rinrin", time: "6 mins ago", color: "#c8f7d2" },
    { id: 2, text: "Appointment approved for Rinrin", time: "6 mins ago", color: "#d8ffd8" },
    { id: 3, text: "Appointment approved for Rinrin", time: "6 mins ago", color: "#f0d8ff" },
  ];

  return (
    <div className="grid-container">
      <Sidebar />
      <Header />

      <main className="main-container">

        <div className="main-dash">
          <h3>Welcome Back, Admin!</h3>
          <h4>Have a nice day.</h4>
        </div>

        {/* Top Cards */}
        <div className="main-cards">
          <div className="card">
            <div className="card-inner">
              <h3>Pet Records</h3>
              <BsJournalMedical className="card_icon" />
            </div>
          </div>

          <div className="card">
            <div className="card-inner">
              <h3>Today's Appointments</h3>
              <BsCalendar className="card_icon" />
            </div>
          </div>

          <div className="card">
            <div className="card-inner">
              <h3>Monthly Revenue</h3>
              <BsBarChartFill className="card_icon" />
            </div>
          </div>

          <div className="card">
            <div className="card-inner">
              <h3>Pending Approvals</h3>
              <BsHourglassSplit className="card_icon" />
            </div>
          </div>
        </div>

        {/* NEW SECTIONS BELOW CARDS */}
        <div className="approval-section">
          
          {/* PENDING APPROVALS */}
          <div className="pending-box">
            <h3 className="section-title">⏳ Pending Approvals</h3>

            {pendingApprovals.map(item => (
              <div key={item.id} className="pending-item">
                <h4>Appointment: {item.name}</h4>

                <div className="btn-group">
                  <button className="approve-btn">Approve</button>
                  <button className="decline-btn">Decline</button>
                </div>
              </div>
            ))}
          </div>

          {/* RECENT ACTIVITY */}
          <div className="activity-box">
            <h3 className="section-title">🕒 Recent Activity</h3>

            {recentActivity.map(a => (
              <div key={a.id} className="activity-item" style={{ background: a.color }}>
                <div className="dot"></div>
                <div>
                  <p>{a.text}</p>
                  <span>{a.time}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </main>
    </div>
  );
}

export default AdminHome;
