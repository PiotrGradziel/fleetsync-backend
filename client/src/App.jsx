import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. SETUP API CONNECTION (This talks to Render for Emails)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 2. SETUP AUTH (Keep Supabase for Login/Logout only)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_KEY
);

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <Login />;
  return <Dashboard key={session.user.id} session={session} />;
}

// --- LOGIN COMPONENT ---
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '350px' }}>
        <h1 style={{ color: '#0f172a', margin: '0 0 20px 0' }}>FleetSync Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', padding:'12px', marginBottom:'10px', boxSizing:'border-box'}} required />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:'12px', marginBottom:'20px', boxSizing:'border-box'}} required />
        <button disabled={loading} style={{width:'100%', padding:'12px', background:'#2563eb', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>{loading ? 'Loading...' : 'Sign In'}</button>
      </form>
    </div>
  );
}

// --- DASHBOARD (WITH EMAIL LOGIC) ---
function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [newReg, setNewReg] = useState(''); 
  const [newMake, setNewMake] = useState(''); 
  const [newType, setNewType] = useState('HGV'); 
  const [newDate, setNewDate] = useState('');

  // 1. FETCH DATA (Using API to ensure we see what the backend sees)
  async function fetchFleet() { 
    try {
      const res = await fetch(`${API_URL}/api/vehicles`);
      const data = await res.json();
      if(Array.isArray(data)) setVehicles(data);
    } catch(err) { console.error(err); }
  }

  useEffect(() => { fetchFleet() }, []);

  // 2. UPDATE STATUS (Using API)
  async function updateStatus(id, currentStatus) { 
    const newStatus = currentStatus === 'VOR' ? 'On Road' : 'VOR';
    await fetch(`${API_URL}/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchFleet(); 
  }

  // 3. ADD VEHICLE (THE IMPORTANT PART FOR EMAILS)
  async function addVehicle(e) { 
    e.preventDefault(); 
    if (!newReg || !newDate) return alert("Fill Reg & Date"); 

    try {
      // THIS TALKS TO RENDER -> RENDER SENDS EMAIL -> RENDER SAVES TO DB
      await fetch(`${API_URL}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reg_number: newReg.toUpperCase(), 
          make: newMake, 
          type: newType, 
          mot_expiry: newDate 
        })
      });
      
      setNewReg(''); setNewMake(''); setNewDate(''); 
      fetchFleet();
      alert("✅ Vehicle Added & Email Sent!");
    } catch (err) {
      alert("❌ Error connecting to Backend");
    }
  }

  // LOGIC FOR COLUMNS
  const vorTrucks = vehicles.filter(v => v.status === 'VOR');
  const warningTrucks = vehicles.filter(v => { 
    if(v.status === 'VOR') return false;
    const days = Math.ceil((new Date(v.mot_expiry) - new Date()) / (1000 * 60 * 60 * 24)); 
    return days <= 14; 
  });
  const safeTrucks = vehicles.filter(v => { 
    if(v.status === 'VOR') return false;
    const days = Math.ceil((new Date(v.mot_expiry) - new Date()) / (1000 * 60 * 60 * 24)); 
    return days > 14; 
  });

  const TruckCard = ({ truck, statusType }) => {
    let accent = '#10b981'; let bg = '#ecfdf5'; let btnClass = 'btn-neutral'; let btnText = 'Report Issue';
    if (statusType === 'warning') { accent = '#f59e0b'; bg = '#fffbeb'; }
    if (statusType === 'vor') { accent = '#f43f5e'; bg = '#fff1f2'; btnClass = 'btn-fix'; btnText = 'Mark Fixed'; }

    return (
      <div className="card-hover" style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: accent }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
          <div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>{truck.reg_number}</h3><p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{truck.make} • {truck.type}</p></div>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: bg, color: accent }}>{statusType === 'vor' ? 'VOR' : 'ACTIVE'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: statusType === 'vor' ? '#f43f5e' : '#334155', fontWeight: '600', marginBottom: '12px' }}><span>{statusType === 'vor' ? '🔧' : '📅'}</span>{statusType === 'vor' ? 'Mechanical Failure' : `Due: ${new Date(truck.mot_expiry).toLocaleDateString()}`}</div>
        <button onClick={() => updateStatus(truck.id, truck.status)} className={btnClass}>{btnText}</button>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', margin: 0, padding: 0 }}>
      {/* GLOBAL STYLES */}
      <style>{`
        :root, html, body, #root { max-width: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; overflow-x: hidden; color-scheme: light; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .dashboard-container { width: 100vw; box-sizing: border-box; }
        .top-bar { background: white; border-bottom: 1px solid #e2e8f0; padding: 20px; width: 100%; box-sizing: border-box; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 10px; width: 100%; }
        .board-container { padding: 20px; display: grid; grid-template-columns: 1fr; gap: 20px; width: 100%; box-sizing: border-box; }
        @media (min-width: 1024px) {
            .form-grid { grid-template-columns: 1fr 1fr 1fr 1fr auto; alignItems: end; gap: 20px; }
            .board-container { grid-template-columns: 1fr 1fr 1fr; padding: 30px; gap: 30px; height: calc(100vh - 160px); }
            .column { height: 100%; overflow-y: auto; padding-right: 5px; }
        }
        .card-hover { transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .modern-input { width: 100%; padding: 12px; borderRadius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; box-sizing: border-box; color: black; }
        .btn-primary { background: #0f172a; color: white; width: 100%; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; height: 100%; }
        .btn-neutral { width: 100%; padding: 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; background: #f1f5f9; color: #475569; border: none; cursor: pointer; }
        .btn-fix { width: 100%; padding: 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; background: #10b981; color: white; border: none; cursor: pointer; }
        .label { display: block; font-size: 0.7rem; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
        .nav-blur { background: white; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; width: 100%; }
      `}</style>

      <nav className="nav-blur" style={{ padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#0f172a', color: 'white', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🚛</div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>FleetSync: EMAIL CONNECTED</span>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Sign Out</button>
      </nav>

      <div className="dashboard-container">
        {/* ADD FORM - NOW CONNECTED TO EMAIL BACKEND */}
        <div className="top-bar">
           <form onSubmit={addVehicle} className="form-grid">
            <div><label className="label">Registration</label><input type="text" placeholder="AB12 CDE" value={newReg} onChange={e => setNewReg(e.target.value)} className="modern-input" /></div>
            <div><label className="label">Make & Model</label><input type="text" placeholder="e.g. Scania R450" value={newMake} onChange={e => setNewMake(e.target.value)} className="modern-input" /></div>
            <div><label className="label">Type</label><select value={newType} onChange={e => setNewType(e.target.value)} className="modern-input"><option value="HGV">HGV</option><option value="Van">Van</option><option value="Trailer">Trailer</option></select></div>
            <div><label className="label">MOT Expiry</label><input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="modern-input" /></div>
            <button type="submit" className="btn-primary">Add Vehicle</button>
          </form>
        </div>

        {/* COLUMNS */}
        <div className="board-container">
          <div className="column" style={{ background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '2px solid #22c55e', paddingBottom: '10px' }}>
              <span style={{ fontWeight: '800', color: '#166534', fontSize: '0.9rem' }}>ROADWORTHY</span>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>{safeTrucks.length}</span>
            </div>
            {safeTrucks.map(t => <TruckCard key={t.id} truck={t} statusType="safe" />)}
          </div>

          <div className="column" style={{ background: '#f8fafc' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '2px solid #f59e0b', paddingBottom: '10px' }}>
              <span style={{ fontWeight: '800', color: '#92400e', fontSize: '0.9rem' }}>WARNING</span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>{warningTrucks.length}</span>
            </div>
            {warningTrucks.map(t => <TruckCard key={t.id} truck={t} statusType="warning" />)}
          </div>

          <div className="column" style={{ background: '#f8fafc' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '2px solid #ef4444', paddingBottom: '10px' }}>
              <span style={{ fontWeight: '800', color: '#991b1b', fontSize: '0.9rem' }}>VOR / CRITICAL</span>
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>{vorTrucks.length}</span>
            </div>
            {vorTrucks.map(t => <TruckCard key={t.id} truck={t} statusType="vor" />)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App;