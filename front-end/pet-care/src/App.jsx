import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import Signin from './components/Signin';
import Appointment from './components/Appointment';
import UserDashboard from './components/UserDashboard';
import AdminHome from './components/AdminDashboard'
import AdminAppointmentPage from "./components/AdminAppointmentPage"; 
import Profile from './components/profile';
import Logout from './components/Logout';
import AuthCallback from './components/AuthCallback';
import AdminBilling from './components/AdminBilling';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { getToken } from './api/authApi';

const PrivateRoute = ({ element }) => {
  const token = getToken();
  return token ? element : <Navigate to="/login" replace />;
};


function App() {
  return (
    
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/UserDashboard" element={<PrivateRoute element={<UserDashboard />} />} />
        <Route path="/Admin" element={<PrivateRoute element={<AdminHome />} />} />
        <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/admin/appointments" element={<PrivateRoute element={<AdminAppointmentPage />} />} /> 
        <Route path="/admin/billing" element={<PrivateRoute element={<AdminBilling />} />} />
        <Route path="/admin/analytics" element={<PrivateRoute element={<AnalyticsDashboard />} />} />
   
      </Routes>

  );
}

export default App; 
