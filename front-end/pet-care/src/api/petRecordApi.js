const BASE_URL = 'https://pet-management-ro9c.onrender.com/pet-records';

export async function createPetRecord(recordData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(recordData),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Error creating pet record' };
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Create pet record error:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function getPetRecords(pet_id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/pet/${pet_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, records: [] };
    }

    return { success: true, records: data.records || [] };
  } catch (error) {
    console.error('Fetch pet records error:', error);
    return { success: false, records: [] };
  }
}

export async function getAllPetRecords() {
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
      return { success: false, records: [] };
    }

    return { success: true, records: data.records || [] };
  } catch (error) {
    console.error('Fetch all pet records error:', error);
    return { success: false, records: [] };
  }
}

export async function updatePetRecord(record_id, recordData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/${record_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(recordData),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Error updating pet record' };
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Update pet record error:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function deletePetRecord(record_id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/${record_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Error deleting pet record' };
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Delete pet record error:', error);
    return { success: false, message: 'Server error' };
  }
}

