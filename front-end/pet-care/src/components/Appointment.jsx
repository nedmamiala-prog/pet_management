import React, { useState, useEffect } from "react";
import "./Appointment.css";
import { addPet } from "../api/petApi";
import { createAppointment } from "../api/appointmentApi";
import { getAllServices, getAvailableSlots } from "../api/serviceApi";
import { UserPet } from "../api/appointmentApi";



export default function Appointment({ closeModal }) {
  const [step, setStep] = useState(1);
  const [hasPet, setHasPet] = useState(false);
  const [petId, setPetId] = useState(null);
  const [pets, setPets] = useState([]); 

  const [petData, setPetData] = useState({
    pet_name: "",
    breed: "",
    age: "",
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
  time: "", 
  services: [], 
  });

  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({}); 
  const [loadingSlots, setLoadingSlots] = useState({}); 


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


  useEffect(() => {
    if (formData.services.length > 0 && formData.date) {
      formData.services.forEach(serviceName => {
        setLoadingSlots(prev => ({ ...prev, [serviceName]: true }));
        
        getAvailableSlots(serviceName, formData.date)
          .then((response) => {
            if (response.success) {
              const slots = response.availableSlots || [];
              setAvailableSlots(prev => ({ ...prev, [serviceName]: slots }));
              
            
              const currentTime = formData[`time-${serviceName}`];
              if (currentTime && !slots.includes(currentTime)) {
                setFormData((prev) => ({ ...prev, [`time-${serviceName}`]: "" }));
              }
              
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
  }, [formData.services, formData.date]);




  const handleChange = (e) => {
    const { name, value } = e.target;
    if (step === 1) {
      if (hasPet && name === "petSelect") {
        setPetId(value);
      } else {
        setPetData({ ...petData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };


  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));


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

 
    const servicesWithTimes = formData.services.filter(serviceName => {
      return formData[`time-${serviceName}`];
    });

    if (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.phone &&
      formData.date &&
      formData.services.length > 0 &&
      servicesWithTimes.length === formData.services.length
    ) {
      try {
        let finalPetId = petId;

        if (!hasPet) {
          const petResponse = await addPet(petData);
          if (!petResponse.success) throw new Error(petResponse.message);
          finalPetId = petResponse.pet?.pet_id;
        }

   
        const appointmentPromises = formData.services.map(async (serviceName) => {
          const time = formData[`time-${serviceName}`];
          
          const result = await createAppointment({
            pet_id: finalPetId,
            date: formData.date,
            time: time,
            service: serviceName,
            notes: formData.notes
          });
          
          if (!result.success) {
            throw new Error(`Failed to create appointment for ${serviceName}: ${result.message || 'Unknown error'}`);
          }
          
          return result;
        });

        const results = await Promise.all(appointmentPromises);
        console.log('Appointments created:', results);
     
     
      } catch (err) {
        console.error('Appointment creation error:', err);
        const errorMessage = err.message || "Error submitting appointments. Try again.";
        alert(`⚠️ ${errorMessage}`);
      }
    } else {
      if (servicesWithTimes.length < formData.services.length) {
        alert("⚠️ Please select a time for all selected services.");
      } else {
        alert("⚠️ Please complete all required fields.");
      }
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

 
        <form className="form-panel" onSubmit={handleSubmit}>
       
          {step === 1 && (
            <>
              <h3>Pet Information:</h3>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={hasPet}
                  onChange={() => setHasPet(!hasPet)}
                />
                <h4>I already have a pet on file</h4>
              </label>

              {hasPet ? (
                <>
                  <label>Select your pet:</label>
                  <select
                    name="petSelect"
                    value={petId || ""}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Choose your pet --</option>
                      {pets.map((pet) => (
                      <option key={pet.pet_id} value={pet.pet_id}>
                        {pet.pet_name}
                      </option>
                    ))}
                  </select>

                  {petId && (
                    <div className="pet-preview">
                      <p>
                        🐾 <strong>{pets.find((p) => p.pet_id == petId)?.pet_name}</strong>
                      </p>
                      <p>Breed: {pets.find((p) => p.pet_id == petId)?.breed}</p>
                      <p>Age: {pets.find((p) => p.pet_id == petId)?.age}</p>
                      <p>Gender: {pets.find((p) => p.pet_id == petId)?.gender}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="input-group">
                    <input
                      type="text"
                      name="pet_name"
                      placeholder="Pet name"
                      value={petData.pet_name}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="breed"
                      placeholder="Breed"
                      value={petData.breed}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="age"
                    placeholder="Age"
                    value={petData.age}
                    onChange={handleChange}
                    required
                  />
                  <select
                    name="gender"
                    value={petData.gender}
                    onChange={handleChange}
                    required
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
                  />
                </>
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
    <h3>Select Pet Care Service:</h3>
    {services.map((service) => (
      <label key={service.service_id}>
        <input
          type="checkbox"
          value={service.service_name}
          checked={formData.services.includes(service.service_name)}
          onChange={(e) => {
            const serviceName = e.target.value;
            const selected = [...formData.services];
            if (e.target.checked) {
              selected.push(serviceName);
            } else {
              const index = selected.indexOf(serviceName);
              if (index > -1) {
                selected.splice(index, 1);
             
                setFormData(prev => {
                  const newData = { ...prev, services: selected };
                  delete newData[`time-${serviceName}`];
                  return newData;
                });
               
                setAvailableSlots(prev => {
                  const newSlots = { ...prev };
                  delete newSlots[serviceName];
                  return newSlots;
                });
                setLoadingSlots(prev => {
                  const newLoading = { ...prev };
                  delete newLoading[serviceName];
                  return newLoading;
                });
                return;
              }
            }
            setFormData(prev => ({ ...prev, services: selected }));
          }}
        />
        {service.service_name} ({service.duration_minutes} min)
      </label>
    ))}

    {formData.services.length > 0 && (
      <>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          min={new Date().toISOString().split("T")[0]}
        />

        {formData.services.map(serviceName => {
          const serviceInfo = services.find(s => s.service_name === serviceName);
          return (
            <div key={serviceName} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
              <h4>{serviceName} ({serviceInfo?.duration_minutes || 30} min duration):</h4>
              {loadingSlots[serviceName] ? (
                <p>Loading available slots...</p>
              ) : availableSlots[serviceName] && availableSlots[serviceName].length > 0 ? (
                <select
                  name={`time-${serviceName}`}
                  value={formData[`time-${serviceName}`] || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Time --</option>
                  {availableSlots[serviceName].map(slot => (
                    <option key={slot} value={slot}>
                      {formatTimeSlot(slot)}
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ color: "#ff6b6b" }}>
                  No available slots for this service on the selected date.
                </p>
              )}
            </div>
          );
        })}
      </>
    )}
  </>
)}

          {step === 4 && (
            <>
              <h3>Review Appointment Details:</h3>
              <ul className="review-list">
                <li>
                  <strong>Pet:</strong>{" "}
                  {hasPet
                    ? pets.find((p) => p.pet_id == petId)?.pet_name
                    : petData.pet_name}
                </li>
                <li>
                  <strong>Date:</strong> {formData.date}
                </li>
                <li>
                  <strong>Services ({formData.services.length}):</strong>
                  <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
                    {formData.services.map(serviceName => {
                      const serviceInfo = services.find(s => s.service_name === serviceName);
                      return (
                        <li key={serviceName}>
                          {serviceName} ({serviceInfo?.duration_minutes || 30} min) - {formatTimeSlot(formData[`time-${serviceName}`] || "")}
                        </li>
                      );
                    })}
                  </ul>
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
              <button type="submit" className="finish-btn"  onClick={closeModal}>
                Finish ✔
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}