const BASE_URL = 'http://localhost:5000/notifications';


export const fetchNotifications = async () => {
  try {
    const response = await fetch(BASE_URL, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, notifications: [], message: data.message || 'Failed to fetch notifications' };
    }
    return { success: true, notifications: data.notifications || [] };
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return { success: false, notifications: [], message: 'Something went wrong while fetching notifications' };
  }
};


export async function CreateNotification({ message }) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }), 
    });

    const data = await response.json();
    console.log("Add Notification Response:", data);

    if (!response.ok) {
      return { success: false, message: data.message || 'Error adding notification' };
    }

    return { success: true, notification: data.Notification };
  } catch (error) {
    console.error('Add notification fetch error:', error);
    return { success: false, message: 'Something went wrong while adding notification' };
  }
}


export async function GetUserNotifications() {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/userNotifications`, {
      method: 'GET',
      headers,
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
