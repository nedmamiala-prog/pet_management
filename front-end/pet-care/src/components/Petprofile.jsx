import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Petprofile.css';
import { getUserPets } from '../api/petApi';
import { getPetRecords } from '../api/petRecordApi';
import { updatePetProfilePicture } from '../api/petProfileApi';
import { Camera, X } from 'lucide-react';

function PetProfile() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEditPictureModal, setShowEditPictureModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return 'Unknown';
    const birth = new Date(birthdate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''} old`;
    } else if (years === 1 && months === 0) {
      return '1 year old';
    } else {
      return `${years} year${years !== 1 ? 's' : ''} old`;
    }
  };

  useEffect(() => {
    async function fetchPets() {
      try {
        setLoading(true);
        const response = await getUserPets();
        if (response.success) {
          // Fetch records for each pet
          const petsWithRecords = await Promise.all(
            response.pets.map(async (pet) => {
              const recordsResponse = await getPetRecords(pet.pet_id);
              const records = recordsResponse.success ? recordsResponse.records : [];
              
              // Transform records to match the expected format
              const medicalRecords = records
                .filter(r => ['Dental Cleaning', 'Check Up', 'Emergency'].includes(r.service_type))
                .map(r => ({
                  type: r.service_type,
                  date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
                  diagnostic: r.record_data?.diagnosis || r.record_data?.diagnostic || '',
                  status: r.record_data?.status || '',
                  reminder: r.record_data?.notes || r.record_data?.reminder || ''
                }));

              const vaccinations = records
                .filter(r => r.service_type === 'Vaccination')
                .map(r => ({
                  name: r.record_data?.vaccineType || 'Vaccine',
                  lastTaken: r.record_data?.lastTaken || '',
                  nextDate: r.record_data?.nextDue || ''
                }));

              return {
                id: pet.pet_id,
                pet_id: pet.pet_id,
                name: pet.pet_name,
                birthdate: pet.birthdate,
                age: calculateAge(pet.birthdate),
                species: pet.species || 'Unknown',
                breed: pet.breed || 'Unknown',
                gender: pet.gender || 'Unknown',
                weight: pet.weight || 'Unknown',
                profile_picture: pet.profile_picture || null,
                medicalRecords,
                vaccinations
              };
            })
          );
          setPets(petsWithRecords);
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPets();
  }, []);

  const openModal = (pet) => {
    setSelectedPet(pet);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPet(null);
  };

  const closeEditPictureModal = () => {
    setShowEditPictureModal(false);
    setProfileImagePreview(null);
    setSelectedFile(null);
  };

  const openEditPictureModal = (pet) => {
    setSelectedPet(pet);
    setShowEditPictureModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePetPicture = async () => {
    if (!selectedFile || !selectedPet) return;
    
    try {
      const response = await updatePetProfilePicture(selectedPet.pet_id, selectedFile);
      if (response.success) {
        // Update the pet in the local state
        setPets(prevPets => 
          prevPets.map(pet => 
            pet.pet_id === selectedPet.pet_id 
              ? { ...pet, profile_picture: response.pet.profile_picture }
              : pet
          )
        );
        closeEditPictureModal();
        alert('Pet profile picture updated successfully!');
      } else {
        alert(response.message || 'Failed to update pet profile picture');
      }
    } catch (error) {
      console.error('Error updating pet profile picture:', error);
      alert('Failed to update pet profile picture. Please try again.');
    }
  };

  const navigate = useNavigate();

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="pet-profile-container">
      <div className="pet-profile-header">
        <button
          onClick={handleBackToProfile}
          className="back-button"
        >
          ← Back to Profile
        </button>
        <h1>Registered Pets</h1>
       
      </div>

      <div className="pets-grid">
        {loading ? (
          <div className="no-pets-message">
            <h3>Loading pets...</h3>
          </div>
        ) : pets.length > 0 ? (
          pets.map(pet => (
            <div
              key={pet.id}
              className="pet-card"
              onClick={() => openModal(pet)}
            >
              <div 
                className="pet-avatar"
                style={{
                  backgroundImage: pet.profile_picture ? `url(http://localhost:5000${pet.profile_picture})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  fontSize: pet.profile_picture ? '0' : 'inherit'
                }}
              >
                {!pet.profile_picture && (pet.species === 'Cat' ? '🐱' : pet.species === 'Dog' ? '🐶' : '🐾')}
              </div>
              <button 
                className="camera-button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditPictureModal(pet);
                }}
                title="Update profile picture"
              >
                <Camera size={16} />
              </button>
              <div className="pet-info">
                <h3 className="pet-name">{pet.name}</h3>
                <div className="pet-details">
                  <p><strong>Species:</strong> {pet.species}</p>
                  <p><strong>Breed:</strong> {pet.breed}</p>
                  <p><strong>Gender:</strong> {pet.gender}</p>
                  <p><strong>Age:</strong> {pet.age}</p>
                </div>
              </div>
              <div className="view-details">Click to view details</div>
            </div>
          ))
        ) : (
          <div className="no-pets-message">
            <h3>No pets registered yet</h3>
            <p>Add your first pet to get started!</p>
          </div>
        )}
      </div>



      {/* Modal */}
      {isModalOpen && selectedPet && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>✕</button>
            
            <div className="modal-header">
              
              <div className="pet-basic-info">
                <p><strong>Birthdate:</strong> {selectedPet.birthdate ? new Date(selectedPet.birthdate).toLocaleDateString() : 'Unknown'}</p>
                <p><strong>Age:</strong> {selectedPet.age}</p>
                <p><strong>Species:</strong> {selectedPet.species}</p>
                <p><strong>Breed:</strong> {selectedPet.breed}</p>
                <p><strong>Gender:</strong> {selectedPet.gender}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="medical-records">
                <h3>Medical History</h3>
                
                {selectedPet.medicalRecords.map((record, index) => (
                  <div key={index} className="record-section">
                    <h4>{record.type}</h4>
                    {record.date && <p><strong>Date:</strong> {record.date}</p>}
                    <p><strong>Diagnostic:</strong> {record.diagnostic}</p>
                    {record.status && <p><strong>Status:</strong> {record.status}</p>}
                    <p><strong>Reminder:</strong> {record.reminder}</p>
                  </div>
                ))}
              </div>

              <div className="vaccination-records">
                <h3>Vaccination</h3>
                
                {selectedPet.vaccinations.map((vaccine, index) => (
                  <div key={index} className="vaccine-section">
                    <h4>{vaccine.name}</h4>
                    <p><strong>Last taken:</strong> {vaccine.lastTaken}</p>
                    <p><strong>Next date:</strong> {vaccine.nextDate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Picture Modal */}
      {showEditPictureModal && selectedPet && (
        <div className="modal-overlay" onClick={closeEditPictureModal}>
          <div className="modal-content edit-picture-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update {selectedPet.name}'s Profile Picture</h3>
              <button onClick={closeEditPictureModal} className="close-modal">
                <X size={20} />
              </button>
            </div>
            
            <div className="edit-picture-content">
              <div className="current-picture">
                <div 
                  className="pet-avatar-large"
                  style={{
                    backgroundImage: selectedPet.profile_picture ? `url(http://localhost:5000${selectedPet.profile_picture})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!selectedPet.profile_picture && (selectedPet.species === 'Cat' ? '🐱' : selectedPet.species === 'Dog' ? '🐶' : '🐾')}
                </div>
              </div>
              
              <div className="upload-section">
                <label htmlFor="pet-picture-upload" className="upload-button">
                  <Camera size={20} />
                  Choose New Picture
                </label>
                <input
                  id="pet-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                
                {profileImagePreview && (
                  <div className="preview-section">
                    <h4>Preview:</h4>
                    <img 
                      src={profileImagePreview} 
                      alt="Preview" 
                      className="preview-image"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-buttons">
              <button onClick={closeEditPictureModal} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={handleSavePetPicture} 
                className="btn-save"
                disabled={!selectedFile}
              >
                Save Picture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PetProfile;