import React, { useState, useEffect } from "react";
import "./Appointment.css";
import { addPet } from "../api/petApi";
import { createAppointment } from "../api/appointmentApi";
import { getAllServices, getAvailableSlots } from "../api/serviceApi";
import { UserPet } from "../api/appointmentApi";



export default function Appointment({ closeModal }) {
  const [step, setStep] = useState(1);
  const [hasPet, setHasPet] = useState(false);
  const [selectedPetIds, setSelectedPetIds] = useState([]); // Multiple pets
  const [pets, setPets] = useState([]); 
  const [newPets, setNewPets] = useState([]); // New pets to be created

  const [petData, setPetData] = useState({
    pet_name: "",
    birthdate: "",
    species: "",
    breed: "",
    gender: "",
    medical_history: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    date: "",
  });

  // Structure: { petId: { services: [], times: {} } }
  const [petServices, setPetServices] = useState({});

  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({}); 
  const [loadingSlots, setLoadingSlots] = useState({}); 
  const [notification, setNotification] = useState(null);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const firstName = payload.first_name || "";
        const lastName = payload.last_name || "";
        const email = payload.email || "";
        const phone = payload.phone_number || "";
        setFormData((prev) => ({ ...prev, firstName, lastName, email, phone }));
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
    

 
    async function fetchServices() {
      const response = await getAllServices();
      if (response.success) {
        setServices(response.services);
      }
    }
    fetchServices();
  }, []);
  
useEffect(() => {
  async function fetchUserPets() {
    try {
      const response = await UserPet();
      if (response.success) {
        setPets(response.pets);
      } else {
        console.error(response.message);
      }
    } catch (err) {
      console.error("Fetch user pets error:", err);
    }
  }

  fetchUserPets();
}, []);


  // Fetch available slots for all selected services across all pets
  useEffect(() => {
    if (formData.date) {
      const allServices = new Set();
      Object.values(petServices).forEach(petData => {
        petData.services?.forEach(service => allServices.add(service));
      });

      allServices.forEach(serviceName => {
        setLoadingSlots(prev => ({ ...prev, [serviceName]: true }));
        
        getAvailableSlots(serviceName, formData.date)
          .then((response) => {
            if (response.success) {
              const slots = response.availableSlots || [];
              setAvailableSlots(prev => ({ ...prev, [serviceName]: slots }));
              
              if (slots.length === 0) {
                console.warn(`No available slots for ${serviceName} on ${formData.date}`);
              }
            } else {
              console.error(`Failed to fetch slots for ${serviceName}:`, response.message);
              setAvailableSlots(prev => ({ ...prev, [serviceName]: [] }));
            }
          })
          .catch((error) => {
            console.error(`Error fetching slots for ${serviceName}:`, error);
            setAvailableSlots(prev => ({ ...prev, [serviceName]: [] }));
          })
          .finally(() => {
            setLoadingSlots(prev => ({ ...prev, [serviceName]: false }));
          });
      });
    } else {
      setAvailableSlots({});
      setLoadingSlots({});
    }
  }, [petServices, formData.date]);




  const handleChange = (e) => {
    const { name, value } = e.target;
    if (step === 1) {
      if (hasPet && name === "petSelect") {
        // Handle multiple pet selection
        const petIdNum = parseInt(value);
        if (e.target.checked) {
          setSelectedPetIds(prev => [...prev, petIdNum]);
        } else {
          setSelectedPetIds(prev => prev.filter(id => id !== petIdNum));
          // Remove services for deselected pet
          setPetServices(prev => {
            const newState = { ...prev };
            delete newState[petIdNum];
            return newState;
          });
        }
      } else {
        setPetData({ ...petData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddNewPet = () => {
    const newPet = { ...petData, tempId: Date.now() };
    setNewPets(prev => [...prev, newPet]);
    setPetData({
      pet_name: "",
      birthdate: "",
      species: "",
      breed: "",
      gender: "",
      medical_history: "",
    });
  };

  const handleRemoveNewPet = (tempId) => {
    setNewPets(prev => prev.filter(p => p.tempId !== tempId));
    setPetServices(prev => {
      const newState = { ...prev };
      delete newState[`new-${tempId}`];
      return newState;
    });
  };

  const handlePetServiceToggle = (petId, serviceName) => {
    setPetServices(prev => {
      const petData = prev[petId] || { services: [], times: {} };
      const services = [...petData.services];
      const times = { ...petData.times };
      
      if (services.includes(serviceName)) {
        // Remove service
        const index = services.indexOf(serviceName);
        services.splice(index, 1);
        delete times[serviceName];
      } else {
        // Add service
        services.push(serviceName);
      }
      
      return {
        ...prev,
        [petId]: { services, times }
      };
    });
  };

  const handlePetServiceTimeChange = (petId, serviceName, time) => {
    setPetServices(prev => {
      const petData = prev[petId] || { services: [], times: {} };
      return {
        ...prev,
        [petId]: {
          ...petData,
          times: { ...petData.times, [serviceName]: time }
        }
      };
    });
  };


  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const findServiceByName = (serviceName) => services.find((s) => s.service_name === serviceName);
  
  const calculateTotalCost = () => {
    let total = 0;
    Object.values(petServices).forEach(petData => {
      petData.services?.forEach(serviceName => {
        const info = findServiceByName(serviceName);
        total += (Number(info?.price) || 0);
      });
    });
    return total;
  };

  const totalCost = calculateTotalCost();

  const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;


  const formatTimeSlot = (time) => {
    if (time === "Anytime (24/7 available)" || time.includes("Anytime")) {
      return time;
    }

    if (time.includes(":")) {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that we have at least one pet selected
    const allPetIds = [...selectedPetIds, ...newPets.map(p => `new-${p.tempId}`)];
    if (allPetIds.length === 0) {
      setNotification({
        title: 'No pets selected',
        message: 'Please select or add at least one pet.',
      });
      return;
    }

    // Validate that all pets have at least one service with time
    let hasError = false;
    let errorMessage = '';

    for (const petId of allPetIds) {
      const petData = petServices[petId];
      if (!petData || !petData.services || petData.services.length === 0) {
        hasError = true;
        errorMessage = 'Each pet must have at least one service selected.';
        break;
      }

      // Check that all services have times
      const missingTimes = petData.services.filter(service => !petData.times[service]);
      if (missingTimes.length > 0) {
        hasError = true;
        errorMessage = `Please select a time for all services for each pet.`;
        break;
      }
    }

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.date
    ) {
      hasError = true;
      errorMessage = 'Please complete all required fields.';
    }

    if (hasError) {
      setNotification({
        title: 'Incomplete details',
        message: errorMessage,
      });
      return;
    }

    try {
      const appointmentPromises = [];

      // Create appointments for existing pets
      for (const petId of selectedPetIds) {
        const petData = petServices[petId];
        if (petData && petData.services) {
          for (const serviceName of petData.services) {
            const time = petData.times[serviceName];
            appointmentPromises.push(
              createAppointment({
                pet_id: petId,
                date: formData.date,
                time: time,
                service: serviceName,
                notes: formData.notes
              })
            );
          }
        }
      }

      // Create new pets and their appointments
      for (const newPet of newPets) {
        const petIdKey = `new-${newPet.tempId}`;
        const petData = petServices[petIdKey];
        
        // Create the pet first
        const petResponse = await addPet(newPet);
        if (!petResponse.success) {
          throw new Error(`Failed to create pet ${newPet.pet_name}: ${petResponse.message}`);
        }
        
        const createdPetId = petResponse.pet?.pet_id;
        
        // Create appointments for this new pet
        if (petData && petData.services) {
          for (const serviceName of petData.services) {
            const time = petData.times[serviceName];
            appointmentPromises.push(
              createAppointment({
                pet_id: createdPetId,
                date: formData.date,
                time: time,
                service: serviceName,
                notes: formData.notes
              })
            );
          }
        }
      }

      const results = await Promise.all(appointmentPromises);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        throw new Error(`Failed to create ${failed.length} appointment(s).`);
      }

      console.log('Appointments created:', results);
      setNotification({
        title: 'Success!',
        message: `Successfully created ${results.length} appointment(s).`,
      });
      
      // Reset form after successful submission
      setStep(1);
      setSelectedPetIds([]);
      setNewPets([]);
      setPetServices({});
      setFormData(prev => ({
        ...prev,
        date: '',
        notes: ''
      }));
      
      // Close modal after a delay (only if closeModal is provided)
      if (closeModal) {
        setTimeout(() => {
          closeModal();
        }, 3000);
      }
    } catch (err) {
      console.error('Appointment creation error:', err);
      const errorMessage = err.message || "Error submitting appointments. Try again.";
      setNotification({
        title: 'Booking failed',
        message: errorMessage,
      });
    }
  };



  return (
    <div className="appointment-container">
      <div className="appointment-box">

        <div className="steps-indicator">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className={`step-circle ${step === num ? "active" : ""}`}>
              {num}
            </div>
          ))}
        </div>


        <div className="right-panel">
          <i className="fa-solid fa-paw icon"></i>
          <h2>Book Your Pet's Appointment</h2>
          <p>Add your pet details and schedule their next visit with ease.</p>
          <p className="contact-info">
            <strong>09912345678</strong>
            <br />
            <span>petcare@gmail.com</span>
          </p>
        </div>

 
        <form className="form-panel" onSubmit={(e) => {
          e.preventDefault();
          // Only submit if we're on step 4 and the submit button was clicked
          if (step === 4) {
            handleSubmit(e);
          }
        }} onKeyDown={(e) => {
          // Prevent form submission on Enter key except for submit button
          if (e.key === 'Enter' && e.target.type !== 'textarea' && e.target.type !== 'submit' && e.target.type !== 'button') {
            e.preventDefault();
            // Move to next step if not on last step
            if (step < 4) {
              handleNext();
            }
          }
        }}>
       
          {step === 1 && (
            <>
              <h3>Pet Information:</h3>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={hasPet}
                  onChange={() => {
                    setHasPet(!hasPet);
                    if (!hasPet) {
                      setSelectedPetIds([]);
                      setPetServices({});
                    }
                  }}
                />
                <h4>I already have pets on file</h4>
              </label>

              {hasPet && pets.length > 0 && (
                <>
                  <label>Select your pets (you can select multiple):</label>
                  <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {pets.map((pet) => (
                      <label key={pet.pet_id} style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="petSelect"
                          value={pet.pet_id}
                          checked={selectedPetIds.includes(pet.pet_id)}
                          onChange={handleChange}
                        />
                        <span style={{ marginLeft: '8px' }}>
                          <strong>{pet.pet_name}</strong> - {pet.species || 'Unknown'} ({pet.breed || 'Unknown'})
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {selectedPetIds.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                      <strong>Selected Pets ({selectedPetIds.length}):</strong>
                      {selectedPetIds.map(id => {
                        const pet = pets.find(p => p.pet_id === id);
                        return pet ? (
                          <div key={id} style={{ marginTop: '5px' }}>
                            🐾 {pet.pet_name} - {pet.species || 'Unknown'}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Add new pets section */}
              <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                <h4>Add New Pet(s):</h4>
                <div className="input-group">
                  <input
                    type="text"
                    name="pet_name"
                    placeholder="Pet name"
                    value={petData.pet_name}
                    onChange={handleChange}
                  />
                  <select
                    name="species"
                    value={petData.species}
                    onChange={handleChange}
                  >
                    <option value="">Select Species</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    name="breed"
                    placeholder="Breed"
                    value={petData.breed}
                    onChange={handleChange}
                  />
                  <input
                    type="date"
                    name="birthdate"
                    placeholder="Birthdate"
                    value={petData.birthdate}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <select
                  name="gender"
                  value={petData.gender}
                  onChange={handleChange}
                  style={{ width: '100%', marginBottom: '10px' }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  type="text"
                  name="medical_history"
                  placeholder="Medical history (optional)"
                  value={petData.medical_history}
                  onChange={handleChange}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <button
                  type="button"
                  onClick={handleAddNewPet}
                  disabled={!petData.pet_name || !petData.species || !petData.breed || !petData.birthdate || !petData.gender}
                  style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Add Pet to List
                </button>
              </div>

              {newPets.length > 0 && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                  <strong>New Pets to be Added ({newPets.length}):</strong>
                  {newPets.map((pet, idx) => (
                    <div key={pet.tempId} style={{ marginTop: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🐾 {pet.pet_name} - {pet.species}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPet(pet.tempId)}
                        style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(selectedPetIds.length > 0 || newPets.length > 0) && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                  <strong>Total Pets Selected: {selectedPetIds.length + newPets.length}</strong>
                </div>
              )}
            </>
          )}

       
          {step === 2 && (
            <>
              <h3>Pet Owner Info:</h3>
              <div className="input-group">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  readOnly
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  readOnly
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <textarea
                name="notes"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </>
          )}

      
      {step === 3 && (
  <>
    <h3>Select Date and Services for Each Pet:</h3>
    
    <input
      type="date"
      name="date"
      value={formData.date}
      onChange={handleChange}
      required
      min={new Date().toISOString().split("T")[0]}
      style={{ width: '100%', marginBottom: '20px', padding: '8px' }}
    />

    {/* Services for existing pets */}
    {selectedPetIds.map(petId => {
      const pet = pets.find(p => p.pet_id === petId);
      if (!pet) return null;
      
      const petData = petServices[petId] || { services: [], times: {} };
      
      return (
        <div key={petId} style={{ marginBottom: '20px', padding: '15px', border: '2px solid #4CAF50', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h4 style={{ marginBottom: '10px', color: '#4CAF50' }}>
            🐾 {pet.pet_name} ({pet.species || 'Unknown'})
          </h4>
          
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', padding: '8px', backgroundColor: '#fff', marginBottom: '10px' }}>
            {services.map((service) => {
              const isSelected = petData.services?.includes(service.service_name);
              return (
                <label key={service.service_id} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => handlePetServiceToggle(petId, service.service_name)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    {service.service_name} ({service.duration_minutes} min) — {formatCurrency(service.price)}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Time selection for selected services */}
          {petData.services && petData.services.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Select times for {pet.pet_name}:</strong>
              {petData.services.map(serviceName => {
                const serviceInfo = services.find(s => s.service_name === serviceName);
                return (
                  <div key={serviceName} style={{ marginTop: '8px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      {serviceName} ({serviceInfo?.duration_minutes || 30} min) — {formatCurrency(serviceInfo?.price)}
                    </div>
                    {loadingSlots[serviceName] ? (
                      <p style={{ fontSize: '12px' }}>Loading available slots...</p>
                    ) : availableSlots[serviceName] && availableSlots[serviceName].length > 0 ? (
                      <select
                        value={petData.times[serviceName] || ""}
                        onChange={(e) => handlePetServiceTimeChange(petId, serviceName, e.target.value)}
                        required
                        style={{ width: '100%', fontSize: "12px", padding: '4px' }}
                      >
                        <option value="">-- Select Time --</option>
                        {availableSlots[serviceName].map(slot => (
                          <option key={slot} value={slot}>
                            {formatTimeSlot(slot)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p style={{ color: "#ff6b6b", fontSize: "12px"}}>
                        No available slots for this service on the selected date.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    })}

    {/* Services for new pets */}
    {newPets.map(newPet => {
      const petIdKey = `new-${newPet.tempId}`;
      const petData = petServices[petIdKey] || { services: [], times: {} };
      
      return (
        <div key={newPet.tempId} style={{ marginBottom: '20px', padding: '15px', border: '2px solid #FF9800', borderRadius: '8px', backgroundColor: '#fff8e1' }}>
          <h4 style={{ marginBottom: '10px', color: '#FF9800' }}>
            🐾 {newPet.pet_name} ({newPet.species || 'Unknown'}) - New Pet
          </h4>
          
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', padding: '8px', backgroundColor: '#fff', marginBottom: '10px' }}>
            {services.map((service) => {
              const isSelected = petData.services?.includes(service.service_name);
              return (
                <label key={service.service_id} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => handlePetServiceToggle(petIdKey, service.service_name)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    {service.service_name} ({service.duration_minutes} min) — {formatCurrency(service.price)}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Time selection for selected services */}
          {petData.services && petData.services.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Select times for {newPet.pet_name}:</strong>
              {petData.services.map(serviceName => {
                const serviceInfo = services.find(s => s.service_name === serviceName);
                return (
                  <div key={serviceName} style={{ marginTop: '8px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      {serviceName} ({serviceInfo?.duration_minutes || 30} min) — {formatCurrency(serviceInfo?.price)}
                    </div>
                    {loadingSlots[serviceName] ? (
                      <p style={{ fontSize: '12px' }}>Loading available slots...</p>
                    ) : availableSlots[serviceName] && availableSlots[serviceName].length > 0 ? (
                      <select
                        value={petData.times[serviceName] || ""}
                        onChange={(e) => handlePetServiceTimeChange(petIdKey, serviceName, e.target.value)}
                        required
                        style={{ width: '100%', fontSize: "12px", padding: '4px' }}
                      >
                        <option value="">-- Select Time --</option>
                        {availableSlots[serviceName].map(slot => (
                          <option key={slot} value={slot}>
                            {formatTimeSlot(slot)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p style={{ color: "#ff6b6b", fontSize: "12px"}}>
                        No available slots for this service on the selected date.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    })}

    {totalCost > 0 && (
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <p style={{ fontWeight: 600, fontSize: '16px' }}>
          Total Estimated Cost: {formatCurrency(totalCost)}
        </p>
      </div>
    )}
  </>
)}

          {step === 4 && (
            <>
              <h3>Review Appointment Details:</h3>
              <ul className="review-list">
                <li>
                  <strong>Date:</strong> {formData.date}
                </li>
                <li>
                  <strong>Total Pets:</strong> {selectedPetIds.length + newPets.length}
                </li>
                
                {/* Review existing pets */}
                {selectedPetIds.map(petId => {
                  const pet = pets.find(p => p.pet_id === petId);
                  const petData = petServices[petId];
                  if (!pet || !petData || !petData.services) return null;
                  
                  return (
                    <li key={petId} style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                      <strong>🐾 {pet.pet_name} ({pet.species || 'Unknown'}):</strong>
                      <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                        {petData.services.map(serviceName => {
                          const serviceInfo = services.find(s => s.service_name === serviceName);
                          const time = petData.times[serviceName];
                          return (
                            <li key={serviceName}>
                              {serviceName} ({serviceInfo?.duration_minutes || 30} min) - {formatTimeSlot(time || "")} — {formatCurrency(serviceInfo?.price)}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}

                {/* Review new pets */}
                {newPets.map(newPet => {
                  const petIdKey = `new-${newPet.tempId}`;
                  const petData = petServices[petIdKey];
                  if (!petData || !petData.services) return null;
                  
                  return (
                    <li key={newPet.tempId} style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff8e1', borderRadius: '4px' }}>
                      <strong>🐾 {newPet.pet_name} ({newPet.species || 'Unknown'}) - New Pet:</strong>
                      <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                        {petData.services.map(serviceName => {
                          const serviceInfo = services.find(s => s.service_name === serviceName);
                          const time = petData.times[serviceName];
                          return (
                            <li key={serviceName}>
                              {serviceName} ({serviceInfo?.duration_minutes || 30} min) - {formatTimeSlot(time || "")} — {formatCurrency(serviceInfo?.price)}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}

                <li style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                  <strong>Total Cost:</strong> {formatCurrency(totalCost)}
                </li>
                {formData.notes && (
                  <li>
                    <strong>Notes:</strong> {formData.notes}
                  </li>
                )}
              </ul>
            </>
          )}

      
          <div className="button-group">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="back-btn">
                ← Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="next-btn">
                Next Step →
              </button>
            ) : (
              <button type="submit" className="finish-btn">
                Submit Appointment ✔
              </button>
            )}
          </div>
        </form>
      </div>

      {notification && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              type="button"
              className="close-modal"
              onClick={() => setNotification(null)}
            >
              ×
            </button>
            <h3>{notification.title}</h3>
            <p>{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}