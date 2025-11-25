import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";
import LightRays from "./LightRays";
import { loginUser, getGoogleAuthUrl } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(location.state?.error || null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError("Please fill out all fields!");
      return;
    }

    try {
      const result = await loginUser(formData);
      if (result.message === "Login successful" || result.message === "Admin login successful") {
        setError(null);
        if (result.role === 'admin') {
          navigate("/Admin");
        } else {
          navigate("/UserDashboard");
        }
      } else {
        setError(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
      console.error(error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('Initiating Google login...');
      const authUrl = await getGoogleAuthUrl();
      console.log('Redirecting to:', authUrl);
      
      if (!authUrl || !authUrl.startsWith('https://')) {
        throw new Error('Invalid authentication URL received');
      }
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google login error:', error);
      setError(`Google sign-in failed: ${error.message || 'Please check your console for details and try again.'}`);
    }
  };

  return (
    <div className="auth-container">
      <div className="overlay"></div>

      

      <div className="form-section" style={{ position: "relative", zIndex: 2 }}>
        <div className="form-wrapper">
          <div className="logo"><span>PetCare</span></div>
          <h2>Welcome Back!</h2>

          {error && (
            <div
              style={{
                marginBottom: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="login-btn">Login</button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="google-btn"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '16px',
              fontWeight: '500',
              marginTop: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="form-footer">
            <p>
              Don’t have an account?{" "}
              <a href="/signin" className="link">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
