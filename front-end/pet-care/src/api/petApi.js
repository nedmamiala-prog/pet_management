const BASE_URL = 'http://localhost:5000/pets';

export async function addPet(petData) {

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(petData),
    });

    const data = await response.json();
    console.log("Add Pet Response:", data);

    if (!response.ok) {
      return { success: false, message: data.message || 'Error adding pet' };
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Add fetch error:', error);
    return { success: false, message: 'Server error during registration' };
  }
}

export async function getUserPets() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, pets: [] };
    }

    return { success: true, pets: data.pets };
  } catch (error) {
    console.error('Fetch pets error:', error);
    return { success: false, pets: [] };
  }
}

export async function getAllPets() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, pets: [] };
    }

    return { success: true, pets: data.pets || [] };
  } catch (error) {
    console.error('Fetch all pets error:', error);
    return { success: false, pets: [] };
  }
}