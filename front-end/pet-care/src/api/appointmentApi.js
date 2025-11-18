const BASE_URL = 'http://localhost:5000/appointments';


export async function createAppointment({ pet_id, date, time, service, notes }) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const date_time = `${date} ${time}`;

  try {
    const response = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pet_id, date_time, service, notes }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to create appointment' };
    }

    return { success: true, appointment: data };
  } catch (error) {
    console.error('Create appointment error:', error);
    return { success: false, message: 'Something went wrong while creating the appointment' };
  }
}


export async function getUserAppointment() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}/userAppointment`, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, appointments: [], message: data.message || 'Failed to fetch user appointments' };
    }

    return { success: true, appointments: data.appointments || [] };
  } catch (error) {
    console.error('Fetch user appointments error:', error);
    return { success: false, appointments: [], message: 'Something went wrong while fetching user appointments' };
  }
}


export async function AppointmentGetAll() {
   const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}/allAppointment`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, appointments: [], message: data.message || 'Failed to fetch all appointments' };
    }

    return { success: true, appointments: data.appointments || [] };
  } catch (error) {
    console.error('Fetch all appointments error:', error);
    return { success: false, appointments: [], message: 'Something went wrong while fetching all appointments' };
  }
}


export async function HandleAccept(appointment_id) {
  const token = localStorage.getItem('token');
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
   
    const response = await fetch(`${BASE_URL}/acceptAppointment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ appointment_id })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to accept appointment');
    }

    return await response.json();
  } catch (error) {
    console.error('Accept appointment error:', error);
    throw error;
  }
}

export async function UserPet() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  try {
    const response = await fetch(`${BASE_URL}/userPet`, {
      method: 'POST',
      headers,
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, pets: [], message: data.message || 'Failed to fetch user pets' };
    }
    return { success: true, pets: data.pets || [] };  
  } catch (error) {
    console.error('Fetch user pets error:', error);
    return { success: false, pets: [], message: 'Something went wrong while fetching user pets' };
    
  };
}
