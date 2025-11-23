const BASE_URL = 'http://localhost:5000/api';

export async function updateProfilePicture(file) {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await fetch(`${BASE_URL}/profile-picture`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Error updating profile picture' };
    }

    // Update localStorage with new user data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Update profile picture error:', error);
    return { success: false, message: 'Server error' };
  }
}
