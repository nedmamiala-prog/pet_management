const BASE_URL = 'http://localhost:5000/api';

export async function updateUserProfile(profileData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Error updating profile' };
    }

    // Update localStorage with new user data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, message: 'Server error' };
  }
}

