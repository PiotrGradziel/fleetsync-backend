import { useEffect, useState } from 'react';

// Use Vercel Environment Variable, or fallback to local for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [reg, setReg] = useState('');
  const [make, setMake] = useState('');
  const [type, setType] = useState('HGV');
  const [motDate, setMotDate] = useState('');

  // Styles defined as objects to force them into the HTML
  const inputStyle = {
    color: '#000000',
    backgroundColor: '#ffffff',
    border: '2px solid #333',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    marginRight: '5px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    background: '#2ecc71',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '4px'
  };

  // 1. LOAD DATA
  useEffect(() => {
    fetch(`${API_URL}/api/vehicles`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehicles(data);
      })
      .catch(err => console.error("Error loading vehicles:", err));
  }, []);

  // 2. ADD VEHICLE
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reg_number: reg.toUpperCase(), 
          make: make.toUpperCase(), 
          type, 
          mot_expiry: motDate 
        })
      });
      const newVehicle = await response.json();
      setVehicles([...vehicles, newVehicle]);
      setReg(''); setMake(''); setMotDate('');
    } catch (err) {
      alert("Failed to add vehicle. Check Console for CORS errors.");
    }
  };

  // 3. DELETE VEHICLE
  const handleDelete = async (id) => {
    if(!confirm("Remove this vehicle?")) return;
    await fetch(`${API_URL}/api/vehicles/${id}`, { method: 'DELETE' });
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  // 4. TOGGLE STATUS
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'On Road' ? 'VOR' : 'On Road';
    const response = await fetch(`${API_URL}/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const updatedVehicle = await response.json();
    setVehicles(vehicles.map(v => (v.id === id ? updatedVehicle : v)));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', color: '#333' }}>
      <h1>🚛 FleetSync Pro</h1>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Add New Vehicle</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            placeholder="REG NUMBER" 
            value={reg} 
            onChange={e => setReg(e.target.value)} 
            required 
            style={inputStyle} 
          />
          <input 
            placeholder="MAKE" 
            value={make} 
            onChange={e => setMake(e.target.value)} 
            required 
            style={inputStyle} 
          />
          <select 
            value={type} 
            onChange={e => setType(e.target.value)} 
            style={inputStyle}
          >
            <option value="HGV">HGV</option>
            <option value="Van">Van</option>
            <option value="Trailer">Trailer</option>
          </select>
          <input 
            type="date" 
            value={motDate} 
            onChange={e => setMotDate(e.target.value)} 
            required 
            style={inputStyle} 
          />
          <button type="submit" style={buttonStyle}>ADD VEHICLE</button>
        </form>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ background: '#333', color: 'white' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left' }}>Reg</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Make</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>MOT Expiry</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}><strong>{v.reg_number}</strong></td>
              <td style={{ padding: '12px' }}>{v.make}</td>
              <td style={{ padding: '12px' }}>{v.type}</td>
              <td style={{ padding: '12px' }}>{v.mot_expiry}</td>
              <td style={{ padding: '12px' }}>
                <button 
                  onClick={() => toggleStatus(v.id, v.status)}
                  style={{ 
                    padding: '5px 10px', 
                    borderRadius: '4px', 
                    border: 'none',
                    cursor: 'pointer',
                    background: v.status === 'VOR' ? '#e74c3c' : '#2ecc71',
                    color: 'white'
                  }}
                >
                  {v.status}
                </button>
              </td>
              <td style={{ padding: '12px' }}>
                <button onClick={() => handleDelete(v.id)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;