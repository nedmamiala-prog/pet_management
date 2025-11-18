import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/authApi';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    logoutUser();
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>Signing you out...</p>
    </div>
  );
}

