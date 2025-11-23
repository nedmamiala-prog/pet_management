import React, { useState, useEffect } from 'react';
import { BsCalendar, BsBarChartFill, BsJournalMedical, BsHourglassSplit } from 'react-icons/bs';
import './Admin.css';
import Sidebar from './Sidebar';
import Header from './Header';
import { getDashboardStats } from '../api/dashboardApi';

function AdminHome() {
  const [stats, setStats] = useState({
    petRecords: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalPets: 0
  });
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        console.log('Dashboard response:', response);
        if (response.success) {
          setStats(response.stats || {
            petRecords: 0,
            todayAppointments: 0,
            monthlyRevenue: 0,
            pendingApprovals: 0,
            totalUsers: 0,
            totalPets: 0
          });
          setPendingAppointments(response.pendingAppointments || []);
          setRecentActivity(response.recentActivity || []);
        } else {
          console.error('Dashboard API error:', response.message);
      
          setStats({
            petRecords: 0,
            todayAppointments: 0,
            monthlyRevenue: 0,
            pendingApprovals: 0,
            totalUsers: 0,
            totalPets: 0
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
       
        setStats({
          petRecords: 0,
          todayAppointments: 0,
          monthlyRevenue: 0,
          pendingApprovals: 0,
          totalUsers: 0,
          totalPets: 0
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="grid-container">
      <Sidebar />
      <Header />

      <main className="main-container">

        <div className="main-dash">
          <h3>Welcome Back, Admin!</h3>
          <h4>Have a nice day.</h4>
        </div>

    
        <div className="main-cards">
          <div className="card">
            <div className="card-inner">
            
              <h3>Pet Records</h3>
              <BsJournalMedical className="card_icon" />
              
              {!loading && <div className="card-value">{stats.petRecords}</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-inner">
              <h3>Today's Appointments</h3>
              <BsCalendar className="card_icon" />
              {!loading && <div className="card-value">{stats.todayAppointments}</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-inner">
              <h3>Monthly Revenue</h3>
              <BsBarChartFill className="card_icon" />
             {!loading && <div className="card-value">₱{Number(stats.monthlyRevenue || 0).toFixed(2)}</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-inner">
              <h3>Pending Approvals</h3>
              <BsHourglassSplit className="card_icon" />
              {!loading && <div className="card-value">{stats.pendingApprovals}</div>}
            </div>
          </div>
        </div>

 
        <div className="approval-section">
          
        
          <div className="pending-box">
            <h3 className="section-title">⏳ Pending Approvals</h3>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : pendingAppointments.length > 0 ? (
              pendingAppointments.map(item => (
                <div key={item.id} className="pending-item">
                  <h4>Appointment: {item.name} - {item.petName}</h4>
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    {item.service} - {new Date(item.dateTime).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No pending approvals</div>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <div className="activity-box">
            <h3 className="section-title">🕒 Recent Activity</h3>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((a, index) => (
                <div key={index} className="activity-item" style={{ background: a.color || '#c8f7d2' }}>
                  <div className="dot"></div>
                  <div>
                    <p>{a.text}</p>
                   
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No recent activity</div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}

export default AdminHome;
