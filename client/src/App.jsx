import { useEffect, useState } from 'react';

// Use Vercel Environment Variable, or fallback to local for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [reg, setReg] = useState('');
  const [make, setMake] = useState('');
  const [type, setType] = useState('HGV');
  const [motDate, setMotDate] = useState('');

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
    if(!confirm("Remove this vehicle from fleet?")) return;
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

  const getMotStyle = (expiryDate) => {
    if (!expiryDate) return {};
    const today = new Date();
    const expiry = new Date(expiryDate);
    if (expiry < today) return { color: '#ff4d4d', fontWeight: 'bold' };
    return {};
  };

  return (
    <div className="dashboard-container">
      {/* NUCLEAR CSS OVERRIDE: Forces black text and visible inputs */}
      <style>{`
        input, select, option {
          color: #000000 !important;
          background-color: #ffffff !important;
          border: 2px solid #61dafb !important;
          padding: 10px !important;
          font-size: 16px !important;
        }
        ::placeholder {
          color: #888888 !important;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #444; }
        .status-badge { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        .status-green { background: #2ecc71; color: white; }
        .status-red { background: #e74c3c; color: white; }
      `}</style>

      <h1>🚛 FleetSync Pro Dashboard</h1>

      <form onSubmit={handleAdd} style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input placeholder="REG NUMBER" value={reg} onChange={e => setReg(e.target.value)} required />
        <input placeholder="MAKE (e.g. DAF)" value={make} onChange={e => setMake(e.target.value)} required />
        <select value={type} onChange={e => setType(e.target.value)}>
          <option>HGV</option>
          <option>Van</option>
          <option>Trailer</option>
        </select>
        <input type="date" value={motDate} onChange={e => setMotDate(e.target.value)} required />
        <button type="submit" style={{ padding: '10px 20px', background: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          ADD VEHICLE
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Reg Number</th>
            <th>Make</th>
            <th>Type</th>
            <th>MOT Expiry</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td><strong>{vehicle.reg_number}</strong></td>
              <td>{vehicle.make}</td>
              <td>{vehicle.type}</td>
              <td style={getMotStyle(vehicle.mot_expiry)}>
                {vehicle.mot_expiry || 'N/A'} {getMotStyle(vehicle.mot_expiry).color && ' ⚠️'}
              </td>
              <td>
                <span 
                  onClick={() => toggleStatus(vehicle.id, vehicle.status)} 
                  className={`status-badge ${vehicle.status === 'VOR' ? 'status-red' : 'status-green'}`} 
                  style={{ cursor: 'pointer' }}
                >
                  {vehicle.status}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => handleDelete(vehicle.id)} 
                  style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;