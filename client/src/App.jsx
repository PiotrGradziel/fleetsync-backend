import { useEffect, useState } from 'react';

// Use Vercel Environment Variable, or fallback to local for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [reg, setReg] = useState('');
  const [make, setMake] = useState('');
  const [motDate, setMotDate] = useState('');

  useEffect(() => {
    // This connects to RENDER, not Supabase
    fetch(`${API_URL}/api/vehicles`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setVehicles(data); })
      .catch(err => console.error("Error:", err));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      // This sends the data to RENDER (which sends the email)
      const response = await fetch(`${API_URL}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reg_number: reg.toUpperCase(), 
          make: make.toUpperCase(), 
          type: 'HGV', 
          mot_expiry: motDate 
        })
      });
      const newVehicle = await response.json();
      setVehicles([...vehicles, newVehicle]);
      setReg(''); setMake(''); setMotDate('');
      alert("Vehicle Sent to Backend!"); // Visual confirmation
    } catch (err) {
      alert("Error connecting to backend");
    }
  };

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '20px', color: 'black', colorScheme: 'light' }}>
      <style>{`
        :root { color-scheme: light; }
        body { background-color: white !important; color: black !important; }
        input { background: white !important; color: black !important; border: 1px solid #333 !important; padding: 10px; margin: 5px; }
        button { background: #2ecc71; color: white; padding: 10px 20px; border: none; cursor: pointer; }
      `}</style>

      {/* CHANGED TITLE TO VERIFY UPDATE */}
      <h1>🚛 FleetSync: EMAIL CONNECTED</h1>
      
      <form onSubmit={handleAdd}>
        <input placeholder="REG" value={reg} onChange={e => setReg(e.target.value)} required />
        <input placeholder="MAKE" value={make} onChange={e => setMake(e.target.value)} required />
        <input type="date" value={motDate} onChange={e => setMotDate(e.target.value)} required />
        <button type="submit">ADD VEHICLE</button>
      </form>

      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead><tr style={{background:'#f0f0f0'}}><th>Reg</th><th>Make</th><th>Status</th></tr></thead>
        <tbody>
          {vehicles.map(v => (
            <tr key={v.id} style={{borderBottom:'1px solid #ddd'}}>
              <td>{v.reg_number}</td><td>{v.make}</td><td>{v.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default App;
