import React, { useState, useEffect } from "react";
import "./PetRecords.css";
import { FaSearch, FaFilter } from "react-icons/fa";
import Sidebar from './Sidebar';
import Header from './Header';
import { getAllPets } from '../api/petApi';
import { getAllPetRecords, createPetRecord, updatePetRecord, deletePetRecord } from '../api/petRecordApi';


const FIGMA_THUMBNAIL = "/mnt/data/2975c55f-667c-464a-92e9-311428588de6.png";


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

export default function PetRecords() {

  const SERVICES = [
    { key: "Dental Cleaning", label: "Dental Cleaning", icon: "🦷" },
    { key: "Check Up", label: "Check Up", icon: "🔎" },
    { key: "Grooming", label: "Grooming", icon: "✂️" },
    { key: "Emergency", label: "Emergency", icon: "⚠️" },
    { key: "Vaccination", label: "Vaccination", icon: "💉" },
    { key: "Reminder", label: "Reminder", icon: "🔔" },
  ];

  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  // Add record flow (external button)
  const [openAddRecordSelector, setOpenAddRecordSelector] = useState(false);
  const [openServiceForm, setOpenServiceForm] = useState(false);
  const [targetPetId, setTargetPetId] = useState(null); // pet to add record to
  const [selectedService, setSelectedService] = useState(null);

  // For both add and edit forms
  const emptyForm = { diagnosis: "", status: "", medication: "", notes: "", vaccineType: "", lastTaken: "", nextDue: "", groomType: "", reminderType: "", lastDate: "", nextDate: "" };
  const [formData, setFormData] = useState(emptyForm);

  // Edit flow: open edit form for existing record
  const [editingRecord, setEditingRecord] = useState(null);

  // Fetch pets and records from backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const petsResponse = await getAllPets();
        const recordsResponse = await getAllPetRecords();

        if (petsResponse.success && recordsResponse.success) {
          // Combine pets with their records
          const petsWithRecords = petsResponse.pets.map(pet => {
            const petRecords = (recordsResponse.records || [])
              .filter(r => r && r.pet_id === pet.pet_id)
              .map(r => ({
                id: `R-${r.record_id}`,
                record_id: r.record_id,
                service: r.service_type,
                data: r.record_data || {}
              }));

            return {
              id: pet.pet_id,
              pet_id: pet.pet_id,
              owner: `${pet.first_name || ''} ${pet.last_name || ''}`.trim() || 'Unknown',
              name: pet.pet_name,
              species: pet.species || 'Unknown',
              gender: pet.gender || 'Unknown',
              birthdate: pet.birthdate,
              age: calculateAge(pet.birthdate),
              profile_picture: pet.profile_picture || null,
              records: petRecords
            };
          });

          setPets(petsWithRecords);
      
          if (petsWithRecords.length > 0 && targetPetId === null) {
            setTargetPetId(petsWithRecords[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
   
  }, []);

  // open pet profile modal (view)
  const openPet = (p) => {
    // ensure we pull latest pet object from pets state
    const fresh = pets.find(x => x.id === p.id) || p;
    setSelectedPet(fresh);
  };

  // helper: save new record to pet id
  async function addRecordToPet(petId, record) {
    try {
      const response = await createPetRecord({
        pet_id: petId,
        service_type: record.service,
        data: record.data
      });

      if (response.success) {
        const newRecord = {
          id: `R-${response.record.record_id}`,
          record_id: response.record.record_id,
          service: record.service,
          data: record.data
        };

        setPets(prev => prev.map(p => p.id === petId ? { ...p, records: [...p.records, newRecord] } : p));
        // refresh selectedPet view if it's the same pet
        if (selectedPet && selectedPet.id === petId) {
          setSelectedPet(prev => ({ ...prev, records: [...prev.records, newRecord] }));
        }
      }
    } catch (error) {
      console.error('Error adding record:', error);
    }
  }

  async function updateRecordOnPet(petId, recordId, updatedRecord) {
    try {
      const record_id = updatedRecord.record_id || parseInt(recordId.replace('R-', ''));
      const response = await updatePetRecord(record_id, {
        service_type: updatedRecord.service,
        data: updatedRecord.data
      });

      if (response.success) {
        setPets(prev => prev.map(p => {
          if (p.id !== petId) return p;
          return { ...p, records: p.records.map(r => r.id === recordId ? updatedRecord : r) };
        }));
        if (selectedPet && selectedPet.id === petId) {
          setSelectedPet(prev => ({ ...prev, records: prev.records.map(r => r.id === recordId ? updatedRecord : r) }));
        }
      }
    } catch (error) {
      console.error('Error updating record:', error);
    }
  }

  async function deleteRecordFromPet(petId, recordId) {
    try {
      const record_id = parseInt(recordId.replace('R-', ''));
      const response = await deletePetRecord(record_id);

      if (response.success) {
        setPets(prev => prev.map(p => {
          if (p.id !== petId) return p;
          return { ...p, records: p.records.filter(r => r.id !== recordId) };
        }));
        if (selectedPet && selectedPet.id === petId) {
          setSelectedPet(prev => ({ ...prev, records: prev.records.filter(r => r.id !== recordId) }));
        }
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  }

  // trigger Add Record flow (external button)
  const handleOpenAddRecord = () => {
    if (pets.length > 0) {
      setTargetPetId(pets[0].id);
    }
    setSelectedService(null);
    setFormData(emptyForm);
    setOpenAddRecordSelector(true);
  };

  // when selecting a category in selector: store selection and open top form
  const handleChooseService = (serviceKey) => {
    setSelectedService(serviceKey);
    setFormData(emptyForm);
    setOpenServiceForm(true);
  };

  // submit add record form
  const handleSaveNewRecord = (e) => {
    e.preventDefault();
    if (!selectedService) return;
    const newRecord = {
      id: `R-${Date.now()}`,
      service: selectedService,
      data: { ...formData, savedAt: new Date().toISOString() }
    };
    addRecordToPet(targetPetId, newRecord);
    // close service form & selector
    setOpenServiceForm(false);
    setOpenAddRecordSelector(false);
    setSelectedService(null);
    setFormData(emptyForm);
  };

  // open edit form for a specific record (from within pet modal)
  const handleEditRecord = (petId, record) => {
    setEditingRecord({ petId, record });
    setSelectedService(record.service);
    // populate formData with record.data fields mapped sensibly
    const d = record.data || {};
    setFormData({
      diagnosis: d.diagnosis || "",
      status: d.status || "",
      medication: d.medication || "",
      notes: d.notes || "",
      vaccineType: d.vaccineType || "",
      lastTaken: d.lastTaken ? d.lastTaken.split("T")[0] : "",
      nextDue: d.nextDue ? d.nextDue.split("T")[0] : "",
      groomType: d.groomType || "",
      reminderType: d.reminderType || "",
      lastDate: d.lastDate || "",
      nextDate: d.nextDate || ""
    });
    setOpenServiceForm(true);
  };

  // save edited record
  const handleSaveEditedRecord = (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    const updatedRecord = {
      id: editingRecord.record.id,
      service: selectedService,
      data: { ...formData, savedAt: new Date().toISOString() }
    };
    updateRecordOnPet(editingRecord.petId, editingRecord.record.id, updatedRecord);
    // close
    setEditingRecord(null);
    setOpenServiceForm(false);
    setSelectedService(null);
    setFormData(emptyForm);
  };

  return (
    <div className="grid-container">
      <Sidebar />
      <Header />

      <main className="main-container">
        <div className="petrecord-container">

          {/* HEADER: single Add Pet Record button */}
          <div className="record-header">
            <div>
              <h2>Pet Record</h2>
              <p>Manage and track all billing transactions</p>
            </div>
            <button className="add-btn" onClick={handleOpenAddRecord}>Add Pet Record +</button>
          </div>

          {/* CARDS */}
          <div className="stats-cards">
            <div className="stat-box">
              <h4>Total Users</h4>
              <h2>{new Set(pets.map(p => p.owner)).size}</h2>
            </div>
            <div className="stat-box">
              <h4>Total Pets</h4>
              <h2>{pets.length}</h2>
            </div>
          </div>

          {/* SEARCH */}
          <div className="search-container">
        
            <input 
              type="text" 
              placeholder="Search by pet name or owner name" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* FILTERS */}
          <div className="filters">
            <button><FaFilter /> Filters</button>
            <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}>
              <option value="all">All Species</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Other">Other</option>
            </select>
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="all">All Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Pet Profile</th>
                  <th>Owner Name</th>
                  <th>Pet Name</th>
                  <th>Species</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
                  </tr>
                ) : pets
                  .filter(p => {
                    const matchesSearch = searchTerm === "" || 
                      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.owner.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesSpecies = speciesFilter === "all" || p.species === speciesFilter;
                    const matchesGender = genderFilter === "all" || p.gender === genderFilter;
                    return matchesSearch && matchesSpecies && matchesGender;
                  })
                  .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div
                        className="pet-img-box"
                        style={{
                          backgroundImage: p.profile_picture
                            ? `url(https://pet-management-ro9c.onrender.com${p.profile_picture})`
                            : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        {!p.profile_picture && (p.name ? p.name.charAt(0).toUpperCase() : '?')}
                      </div>
                    </td>
                    <td>{p.owner}</td>
                    <td>{p.name}</td>
                    <td>{p.species}</td>
                    <td>{p.gender}</td>
                    <td>{p.age}</td>
                    <td>
                      <button className="view-btn" onClick={() => openPet(p)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* ======================
              PET PROFILE MODAL (view & edit records)
             ====================== */}
          {selectedPet && (
            <div className="modal-overlay" onClick={() => setSelectedPet(null)}>
              <div className="modal-container" onClick={(e) => e.stopPropagation()}>

                <div className="modal-profile-section">
                  <div
                    className="modal-image"
                    style={{
                      backgroundImage: selectedPet.profile_picture
                        ? `url(https://pet-management-ro9c.onrender.com${selectedPet.profile_picture})`
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  ></div>

                  <div className="modal-profile-info">
                    <h2>{selectedPet.name}</h2>

                    <div className="modal-info-grid">
                      <div><strong>Owner:</strong> {selectedPet.owner}</div>
                      <div><strong>Species:</strong> {selectedPet.species}</div>
                      <div><strong>Gender:</strong> {selectedPet.gender}</div>
                      <div><strong>Birthdate:</strong> {selectedPet.birthdate ? new Date(selectedPet.birthdate).toLocaleDateString() : 'Unknown'}</div>
                      <div><strong>Age:</strong> {selectedPet.age}</div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <button className="modal-edit-btn" onClick={() => { setOpenAddRecordSelector(true); setTargetPetId(selectedPet.id); }}>Add / Edit Record</button>
                    </div>
                  </div>
                </div>

                <h3 className="section-title">Medical Record</h3>

                <div style={{ display: "grid", gap: 12 }}>
                  {selectedPet.records.length === 0 && <div className="record-box">No records yet.</div>}
                  {selectedPet.records.map(r => (
                    <div className="record-box" key={r.id}>
                      <div className="record-header-row">
                        <h4>{r.service}</h4>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="record-edit-btn" onClick={() => handleEditRecord(selectedPet.id, r)}>Edit</button>
                          <button className="delete-btn" onClick={() => deleteRecordFromPet(selectedPet.id, r.id)}>Delete</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {/* simple pretty display */}
                        {Object.entries(r.data).map(([k, v]) => (
                          k !== "savedAt" && v && <p key={k}><strong>{k.charAt(0).toUpperCase() + k.slice(1)}:</strong> {String(v)}</p>
                        ))}
                        {r.data.savedAt && (
                          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                            Saved: {new Date(r.data.savedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="close-modal-btn" onClick={() => setSelectedPet(null)}>Close</button>
              </div>
            </div>
          )}

          {/* ======================
              ADD RECORD: CATEGORY SELECTOR (opened from external Add Pet Record or from inside pet modal)
             ====================== */}
          {openAddRecordSelector && (
            <div className="modal-overlay top" onClick={() => { setOpenAddRecordSelector(false); setSelectedService(null); }}>
              <div className="selector-container" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <img src={FIGMA_THUMBNAIL} alt="selector" className="selector-thumb" />
                  <div>
                    <h3 style={{ margin: 0 }}>Add Pet Record</h3>
                    <p style={{ margin: 0, color: "#6b6b6b" }}>Choose service category and target pet</p>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 13, color: "#555" }}>Select Pet</label>
                  <select style={{ width: "100%", padding: 10, borderRadius: 10, marginTop: 8 }} value={targetPetId} onChange={e => setTargetPetId(e.target.value)}>
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name} — {p.owner}</option>)}
                  </select>
                </div>

                <div className="services-grid" style={{ marginTop: 14 }}>
                  {SERVICES.map(s => (
                    <button key={s.key} className="service-option" onClick={() => handleChooseService(s.key)}>
                      <div className="service-icon">{s.icon}</div>
                      <div style={{ marginTop: 10, fontWeight: 700 }}>{s.label}</div>
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  <button className="close-small" onClick={() => setOpenAddRecordSelector(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ======================
              SERVICE FORM MODAL (top-most) — used for both Add & Edit
             ====================== */}
          {openServiceForm && (
            <div className="modal-overlay topmost" onClick={() => {
              setOpenServiceForm(false);
              setEditingRecord(null);
              setSelectedService(null);
            }}>
              <div className="form-container" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>{editingRecord ? `Edit — ${selectedService}` : `Add — ${selectedService}`}</h3>

                <form onSubmit={editingRecord ? handleSaveEditedRecord : handleSaveNewRecord} style={{ display: "grid", gap: 10 }}>
                  {/* fields per service */}
                  {(selectedService === "Dental Cleaning" || selectedService === "Check Up" || selectedService === "Emergency") && (
                    <>
                      <label>Diagnosis</label>
                      <input value={formData.diagnosis} onChange={e => setFormData(f => ({ ...f, diagnosis: e.target.value }))} />

                      <label>Notes</label>
                      <textarea rows="3" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
                    </>
                  )}

                  {selectedService === "Check Up" && (
                    <>
                      <label>Status</label>
                      <input value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} />
                      <label>Medication</label>
                      <input value={formData.medication} onChange={e => setFormData(f => ({ ...f, medication: e.target.value }))} />
                    </>
                  )}

                  {selectedService === "Grooming" && (
                    <>
                      <label>Type of Grooming</label>
                      <input value={formData.groomType} onChange={e => setFormData(f => ({ ...f, groomType: e.target.value }))} />
                      <label>Preferred Style / Notes</label>
                      <textarea rows="2" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
                    </>
                  )}

                  {selectedService === "Vaccination" && (
                    <>
                      <label>Type of Vaccine</label>
                      <input value={formData.vaccineType} onChange={e => setFormData(f => ({ ...f, vaccineType: e.target.value }))} />
                      <label>Last Taken</label>
                      <input type="date" value={formData.lastTaken} onChange={e => setFormData(f => ({ ...f, lastTaken: e.target.value }))} />
                      <label>Next Due</label>
                      <input type="date" value={formData.nextDue} onChange={e => setFormData(f => ({ ...f, nextDue: e.target.value }))} />
                    </>
                  )}

                  {selectedService === "Reminder" && (
                    <>
                      <label>Reminder Type</label>
                      <input value={formData.reminderType} onChange={e => setFormData(f => ({ ...f, reminderType: e.target.value }))} />
                      <label>Last Date</label>
                      <input type="date" value={formData.lastDate} onChange={e => setFormData(f => ({ ...f, lastDate: e.target.value }))} />
                      <label>Next Date</label>
                      <input type="date" value={formData.nextDate} onChange={e => setFormData(f => ({ ...f, nextDate: e.target.value }))} />
                    </>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" className="close-small" onClick={() => {
                      setOpenServiceForm(false);
                      setEditingRecord(null);
                      setSelectedService(null);
                    }}>Cancel</button>

                    <button type="submit" className="modal-save-btn">{editingRecord ? "Save changes" : "Save"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
