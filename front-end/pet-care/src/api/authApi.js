const BASE_URL = 'http://localhost:5000/api';


export async function registerUser(userData) {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Registration failed' };
    }

 
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Register fetch error:', error);
    return { success: false, message: 'Server error during registration' };
  }
}

export async function loginUser(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/login`, {  
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    
    if (!response.ok) { 
      return data; 
    }
    
   
    if (data.message === "Login successful" || data.message === "Admin login successful") {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      const userData = data.user || data.admin;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return data; 
  } catch (error) {
    console.error('Login fetch error:', error);
    return { message: 'Server error during login' };
  }
}


export function getToken() {
  return localStorage.getItem('token');
}

export function getUserRole() {
  return localStorage.getItem('role');
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
}


export async function getGoogleAuthUrl() {
  try {
    const response = await fetch(`${BASE_URL}/auth/google`);
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Google auth URL error:', error);
    throw error;
  }
}