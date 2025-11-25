const BASE_URL = 'https://pet-management-ro9c.onrender.com/dashboard';

export async function getDashboardStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Error fetching dashboard stats' };
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return { success: false, message: 'Server error' };
  }
}

