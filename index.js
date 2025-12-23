// --- FleetSync Pro (Final + Update/Delete) ---
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(morgan('dev'));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. GET: List all
app.get('/', (req, res) => {
    res.send('🚛 FleetSync API is running...');
});
app.get('/api/vehicles', async (req, res) => {
    const { data, error } = await supabase.from('vehicles').select('*').order('id');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. POST: Add new
app.post('/api/vehicles', async (req, res) => {
    const { reg_number, make, type } = req.body;
    const { data, error } = await supabase
        .from('vehicles')
        .insert([{ reg_number, make, type, status: 'On Road' }])
        .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// 3. PUT: Update Status (Toggle VOR / On Road)
app.put('/api/vehicles/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // We send the NEW status here

    const { data, error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// 4. DELETE: Remove vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deleted successfully' });
});

app.listen(PORT, () => console.log(`\n🚀 FleetSync Server running on port ${PORT}`));