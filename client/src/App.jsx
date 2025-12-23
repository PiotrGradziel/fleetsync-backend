import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [reg, setReg] = useState('');
  const [make, setMake] = useState('');
  const [motDate, setMotDate] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/vehicles`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setVehicles(data); })
      .catch(err => console.error(err));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_URL}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reg_number: reg.toUpperCase(), make: make.toUpperCase(), type: 'HGV', mot_expiry: motDate })
    });
    const newV = await response.json();
    setVehicles([...vehicles, newV]);
    setReg(''); setMake(''); setMotDate('');
  };

  return (
    <div className="app-container">
      <style>{`
        /* 1. LIGHT MODE (Default) */
        :root {
          --bg-color: #ffffff;
          --text-color: #000000;
          --input-bg: #ffffff;
          --border-color: #333333;
          --card-bg: #f9f9f9;
        }

        /* 2. DARK MODE (Automatic) */
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-color: #121212;
            --text-color: #ffffff;
            --input-bg: #1e1e1e;
            --border-color: #ffffff;
            --card-bg: #1e1e1e;
          }
        }

        html, body { 
          background-color: var(--bg-color); 
          color: var(--text-color); 
          margin: 0; 
          transition: 0.3s; 
        }

        .app-container { 
          padding: 20px; 
          min-height: 100vh; 
          background-color: var(--bg-color); 
          color: var(--text-color); 
        }

        input { 
          background-color: var(--input-bg) !important; 
          color: var(--text-color) !important; 
          border: 1px solid var(--border-color) !important; 
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 4px;
          -webkit-text-fill-color: var(--text-color) !important; 
        }

        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid var(--border-color); padding: 10px; text-align: left; }
        button { background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
      `}</style>

      <h1>🚛 FleetSync Pro</h1>
      
      <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <h3>Add Vehicle</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
          <input placeholder="REG NUMBER" value={reg} onChange={e => setReg(e.target.value)} required />
          <input placeholder="MAKE" value={make} onChange={e => setMake(e.target.value)} required />
          <input type="date" value={motDate} onChange={e => setMotDate(e.target.value)} required />
          <button type="submit">ADD TO FLEET</button>
        </form>
      </div>

      <table>
        <thead>
          <tr><th>Reg</th><th>Make</th><th>MOT Expiry</th></tr>
        </thead>
        <tbody>
          {vehicles.map(v => (
            <tr key={v.id}>
              <td>{v.reg_number}</td><td>{v.make}</td><td>{v.mot_expiry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;