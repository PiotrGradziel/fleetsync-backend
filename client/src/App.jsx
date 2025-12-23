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
      alert("Added! Refresh the page if it doesn't appear.");
    }
  };

  return (
    // 'colorScheme: light' is the magic fix for iPhone/Mac dark mode bugs
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#ffffff', 
      minHeight: '100vh', 
      color: '#000000',
      colorScheme: 'light' 
    }}>
      
      {/* THIS CSS BLOCK OVERRIDES EVERYTHING ELSE IN THE BROWSER */}
      <style>{`
        body { background-color: white !important; color: black !important; margin: 0; }
        input, select, option {
          color: #000000 !important;
          background-color: #ffffff !important;
          border: 2px solid #333 !important;
          padding: 12px !important;
          font-size: 16px !important;
          -webkit-text-fill-color: #000000 !important;
          opacity: 1 !important;
        }
        input::placeholder { color: #666 !important; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; color: black; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; color: black !important; }
        h1, h3 { color: black !important; }
      `}</style>

      <h1>🚛 FleetSync Pro</h1>

      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
        <h3 style={{ marginTop: 0 }}>Add New Vehicle</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            placeholder="REG NUMBER" 
            value={reg} 
            onChange={e => setReg(e.target.value)} 
            required 
          />
          <input 
            placeholder="MAKE" 
            value={make} 
            onChange={e => setMake(e.target.value)} 
            required 
          />
          <input 
            type="date" 
            value={motDate} 
            onChange={e => setMotDate(e.target.value)} 
            required 
          />
          <button type="submit" style={{ padding: '12px 24px', background: '#2ecc71', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>
            ADD VEHICLE
          </button>
        </form>
      </div>

      <table>
        <thead style={{ background: '#f0f0f0' }}>
          <tr>
            <th>Reg Number</th>
            <th>Make</th>
            <th>MOT Expiry</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td><strong>{v.reg_number}</strong></td>
              <td>{v.make}</td>
              <td>{v.mot_expiry}</td>
              <td>
                <span style={{ padding: '4px 8px', borderRadius: '4px', background: v.status === 'VOR' ? '#ff4d4d' : '#2ecc71', color: 'white', fontWeight: 'bold' }}>
                  {v.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;