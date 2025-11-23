import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPets, addPet } from '../api/petApi';
import { PlusCircle, X } from 'lucide-react';

function UserPet() {
  const [pets, setPets] = useState([]);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [petFormData, setPetFormData] = useState({
    pet_name: '',
    birthdate: '',
    species: '',
    breed: '',
    gender: '',
    medical_history: '',
    profile_picture: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [petImagePreview, setPetImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    const response = await getUserPets();
    if (response.success) {
      setPets(response.pets);
    }
  };

  const handleViewPetProfile = () => {
    navigate('/pet-profile');
  };

  const handleAddPetClick = () => {
    setShowAddPetModal(true);
  };

  const handleCloseModal = () => {
    setShowAddPetModal(false);
    setPetFormData({
      pet_name: '',
      birthdate: '',
      species: '',
      breed: '',
      gender: '',
      medical_history: '',
      profile_picture: ''
    });
    setPetImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setNotification({
          title: 'Error',
          message: 'Image size must be less than 5MB',
          type: 'error'
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPetFormData(prev => ({
          ...prev,
          profile_picture: base64String
        }));
        setPetImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPetFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPet = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await addPet(petFormData);
      if (response.success) {
        await fetchPets(); // Refresh pets list
        handleCloseModal();
        setNotification({
          title: 'Success',
          message: 'Pet added successfully!',
          type: 'success'
        });
      } else {
        setNotification({
          title: 'Error',
          message: response.message || 'Failed to add pet',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error adding pet:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to add pet. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pets-grid">
      {pets.length > 0 ? (
        pets.map((pet) => (
          <div
            className="pet-card"
            key={pet.pet_id}
            onClick={handleViewPetProfile}
            style={{ cursor: 'pointer' }}
          >
            <div className="pet-card-header">
              <div 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundImage: pet.profile_picture ? `url(${pet.profile_picture})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: pet.profile_picture ? 'transparent' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginRight: '15px',
                  flexShrink: 0
                }}
              >
                {!pet.profile_picture && (pet.species === 'Cat' ? '🐱' : pet.species === 'Dog' ? '🐶' : '🐾')}
              </div>
              <div className="pet-info" style={{ flex: 1 }}>
                <h3>{pet.pet_name}</h3>
                <div className="pet-details">
                  <div><strong>Species:</strong> {pet.species || 'Unknown'}</div>
                  <div><strong>Breed:</strong> {pet.breed}</div>
                  <div><strong>Gender:</strong> {pet.gender}</div>
                  {pet.birthdate && (
                    <div><strong>Birthdate:</strong> {new Date(pet.birthdate).toLocaleDateString()}</div>
                  )}
                  {pet.medical_history && (
                    <div><strong>Medical History:</strong> {pet.medical_history}</div>
                  )}
                </div>
              </div>
              <span className="pet-badge">Active</span>
            </div>
          </div>
        ))
      ) : (
        <p>No pets yet 🐾</p>
      )}

      <div
        className="pet-card"
        onClick={handleAddPetClick}
        style={{
          background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
          border: '2px dashed #667eea',
          cursor: 'pointer',
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px', color: '#667eea' }}>
          <PlusCircle size={48} style={{ marginBottom: '10px' }} />
          <h3 style={{ color: '#667eea' }}>Add New Pet</h3>
        </div>
      </div>

      {/* Add Pet Modal */}
      {showAddPetModal && (
        <div className="modal-overlay" onClick={handleCloseModal} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Add New Pet</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitPet}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Pet Name *</label>
                <input
                  type="text"
                  name="pet_name"
                  value={petFormData.pet_name}
                  onChange={handleFormChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Species *</label>
                <select
                  name="species"
                  value={petFormData.species}
                  onChange={handleFormChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Breed *</label>
                <input
                  type="text"
                  name="breed"
                  value={petFormData.breed}
                  onChange={handleFormChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Birthdate *</label>
                <input
                  type="date"
                  name="birthdate"
                  value={petFormData.birthdate}
                  onChange={handleFormChange}
                  required
                  max={new Date().toISOString().split("T")[0]}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Gender *</label>
                <select
                  name="gender"
                  value={petFormData.gender}
                  onChange={handleFormChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Medical History</label>
                <textarea
                  name="medical_history"
                  value={petFormData.medical_history}
                  onChange={handleFormChange}
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Pet Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                {petImagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={petImagePreview} 
                      alt="Preview" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '8px', 
                        objectFit: 'cover',
                        border: '2px solid #ddd'
                      }} 
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#667eea', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                >
                  {loading ? 'Adding...' : 'Add Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setNotification(null)}
        >
          <div
            style={{
              width: '360px',
              maxWidth: '90%',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
              padding: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              marginBottom: '8px', 
              color: notification.type === 'error' ? '#ef4444' : '#10b981' 
            }}>
              {notification.title}
            </h3>
            <p style={{ marginBottom: '16px', color: '#4b5563', fontSize: '14px' }}>
              {notification.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setNotification(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: notification.type === 'error' ? '#fee2e2' : '#d1fae5',
                  color: notification.type === 'error' ? '#991b1b' : '#065f46',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPet;
