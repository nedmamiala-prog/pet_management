const BASE_URL = 'http://localhost:5000/analytics';

export async function fetchAnalyticsOverview() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}/overview`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to fetch analytics overview');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.warn('Analytics overview request failed; falling back to sample data.', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Analytics data unavailable',
    };
  }
}

