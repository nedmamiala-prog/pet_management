const BASE_URL = 'http://localhost:5000/services';


export async function getAllServices() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}/all`, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, services: [], message: data.message || 'Failed to fetch services' };
    }

    return { success: true, services: data.services || [] };
  } catch (error) {
    console.error('Fetch services error:', error);
    return { success: false, services: [], message: 'Something went wrong while fetching services' };
  }
}


export async function getAvailableSlots(service_name, date) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}/slots?service_name=${encodeURIComponent(service_name)}&date=${date}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, availableSlots: [], message: data.message || 'Failed to fetch available slots' };
    }

    return { 
      success: true, 
      availableSlots: data.availableSlots || [],
      duration: data.duration || 30,
      allSlots: data.allSlots || []
    };
  } catch (error) {
    console.error('Fetch available slots error:', error);
    return { success: false, availableSlots: [], message: 'Something went wrong while fetching available slots' };
  }
}

