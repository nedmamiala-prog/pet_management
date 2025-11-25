const BASE_URL = 'https://pet-management-ro9c.onrender.com/pets';

export async function updatePetProfilePicture(petId, file) {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await fetch(`${BASE_URL}/${petId}/profile-picture`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Error updating pet profile picture' };
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Update pet profile picture error:', error);
    return { success: false, message: 'Server error' };
  }
}
