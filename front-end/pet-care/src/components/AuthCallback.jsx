import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { logoutUser } from '../api/authApi';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    if (token) {
    
      localStorage.setItem('token', token);
      localStorage.setItem('role', role || 'user');

      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.first_name && payload.last_name) {
          localStorage.setItem('user', JSON.stringify({
            id: payload.id,
            first_name: payload.first_name,
            last_name: payload.last_name,
            email: payload.email,
            phone_number: payload.phone_number
          }));
        }
      } catch (err) {
        console.error('Error decoding token:', err);
      }


      if (role === 'admin') {
        navigate('/Admin');
      } else {
        navigate('/UserDashboard');
      }
    } else {
 
      alert('Authentication failed. Please try again.');
      logoutUser();
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ fontSize: '18px' }}>Authenticating...</div>
      <div className="spinner" style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite'
      }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

