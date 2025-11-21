const BASE_URL = 'http://localhost:5000/notifications';

const buildHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export async function createNotification({ message, type = 'info' }) {
  try {
    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ message, type }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Error adding notification' };
    }

    return { success: true, notification: data.notification };
  } catch (error) {
    console.error('Add notification fetch error:', error);
    return { success: false, message: 'Something went wrong while adding notification' };
  }
}

export async function getUserNotifications() {
  try {
    const response = await fetch(`${BASE_URL}/userNotification`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, notifications: [], message: data.message || 'Failed to fetch user notifications' };
    }

    return { success: true, notifications: data.notifications || [] };
  } catch (error) {
    console.error('Fetch user notifications error:', error);
    return { success: false, notifications: [], message: 'Something went wrong while fetching user notifications' };
  }
}

export async function markNotificationAsRead(notification_id) {
  try {
    const response = await fetch(`${BASE_URL}/${notification_id}/read`, {
      method: 'PUT',
      headers: buildHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Error marking notification as read' };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return { success: false, message: 'Something went wrong while marking notification as read' };
  }
}
